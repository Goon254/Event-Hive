// app/(tabs)/connections.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { COLORS } from '../theme/constants';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  Text,
  Platform,
  TouchableOpacity,
  TextInput,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenWrapper from '../components/common/ScreenWrapper';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';

// Custom hooks
import { useConnections } from '../hooks/useConnections';
import { useSearch } from '../hooks/useSearch';
import { useWebSocket } from '../services/websocketService';
import { useEncryption } from '../services/encryptionService';
import { useContactSync } from '../services/contactSyncService';
import { useOAuth } from '../services/oauthService';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { useRecommendations } from '../services/recommendationService';

// Components
import LoadingIndicator from '../components/common/LoadingIndicator';
import FloatingActionButton from '../components/common/FloatingActionButton';
import EncryptionIndicator from '../components/connections/EncryptionIndicator';
import ConnectionCard from '../components/connections/ConnectionCard';
import ContactMatchCard from '../components/connections/ContactMatchCard';
import EmptyState from '../components/connections/EmptyState';

/**
 * Connections Screen
 * Main screen for managing user connections
 */
export default function ConnectionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Screen dimensions for responsive layout
  const { height, width } = Dimensions.get('window');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'suggested' | 'discover'>('connections');
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Custom hooks with memoized initialization
  const {
    connections,
    pendingConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
    isLoadingMore,
    hasMoreConnections,
    loadMoreConnections
  } = useConnections(user);
  
  // Recommendations hook
  const {
    recommendations: suggestedConnections,
    isLoading: isLoadingRecommendations,
    loadMoreRecommendations,
    error: recommendationsError,
    fetchRecommendations
  } = useRecommendations(user);
  
  // Only fetch recommendations when the suggested tab is active
  useEffect(() => {
    if (activeTab === 'suggested' && user) {
      fetchRecommendations(false);
    }
  }, [activeTab, user, fetchRecommendations]);
  
  // Load unread message counts - more efficiently
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({});
  
  // Memoized function to load unread counts
  const loadUnreadCounts = useCallback(async () => {
    if (!user || connections.length === 0) return;
    
    try {
      // This would be replaced with actual API call in production
      const { chatService } = require('../services/chatService');
      const totalUnread = await chatService.getTotalUnreadCount(user.id);
      
      if (totalUnread === 0) {
        setUnreadMessages({});
        return;
      }
      
      // For demo purposes, distribute unread counts among connections
      const unreadCounts: {[key: string]: number} = {};
      
      // Randomly assign unread counts to some connections
      const connectionCount = Math.min(3, connections.length);
      const connectionsWithUnread = connections
        .slice(0, connectionCount)
        .map(c => c.connectionId || c.userId);
      
      let remainingUnread = totalUnread;
      
      for (let i = 0; i < connectionsWithUnread.length; i++) {
        const count = i === connectionsWithUnread.length - 1
          ? remainingUnread
          : Math.floor(remainingUnread / (connectionsWithUnread.length - i));
        
        unreadCounts[connectionsWithUnread[i]] = count;
        remainingUnread -= count;
      }
      
      setUnreadMessages(unreadCounts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  }, [user?.id, connections]);
  
  // Load unread counts with debounce to avoid excessive calls
  useEffect(() => {
    if (!user) return;
    
    const timer = setTimeout(loadUnreadCounts, 300);
    return () => clearTimeout(timer);
  }, [loadUnreadCounts, user]);
  
  // Search hook - memoized filtering
  const { 
    searchQuery, 
    setSearchQuery, 
    filteredConnections,
    filteredPendingConnections,
    filteredSuggestedConnections
  } = useSearch(connections, pendingConnections, suggestedConnections);
  
  // Other hooks - lazy initialization
  const { isConnected: _isConnected } = useWebSocket(user?.id || null);
  const { encryptionEnabled, setEncryptionEnabled } = useEncryption(user);
  const { contactMatches, syncContacts, filteredContactMatches } = useContactSync(user, searchQuery);
  const { oauthSignIn, oauthLoading } = useOAuth(user);
  const { privacySettings, updatePrivacySetting } = usePrivacySettings(user);
  
  // Memoized data source based on active tab
  const dataSource = useMemo(() => {
    switch (activeTab) {
      case 'connections':
        return filteredConnections;
      case 'pending':
        return filteredPendingConnections;
      case 'suggested':
        return filteredSuggestedConnections;
      case 'discover':
        return filteredContactMatches;
      default:
        return filteredConnections;
    }
  }, [
    activeTab, 
    filteredConnections, 
    filteredPendingConnections, 
    filteredSuggestedConnections,
    filteredContactMatches
  ]);
  
  // Navigation handler - memoized to prevent recreating on each render
  const handleMessagePress = useCallback((item: any) => {
    router.push({
      pathname: '/screens/ChatScreen',
      params: {
        userId: item.connectionId || item.userId,
        name: item.name,
        avatar: item.avatar || ''
      }
    });
  }, [router]);
  
  // Memoized render function with card styling
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (activeTab === 'discover' && 'phoneNumber' in item) {
      return (
        <View style={styles.cardContainer}>
          <ContactMatchCard
            item={item}
            onConnect={handleConnect}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.cardContainer}>
          <ConnectionCard
            item={item}
            activeTab={activeTab}
            handleConnect={handleConnect}
            unreadMessages={unreadMessages}
            privacySettings={privacySettings}
            onMessagePress={() => handleMessagePress(item)}
          />
        </View>
      );
    }
  }, [activeTab, handleConnect, unreadMessages, privacySettings, handleMessagePress]);
  
  // Memoized handler for EndReached to prevent recreating on each render
  const handleEndReached = useCallback(() => {
    if (activeTab === 'connections' && hasMoreConnections && !isLoadingMore) {
      loadMoreConnections();
    } else if (activeTab === 'suggested' && !recommendationsError && !isLoadingRecommendations) {
      loadMoreRecommendations();
    }
  }, [
    activeTab, 
    hasMoreConnections, 
    isLoadingMore, 
    loadMoreConnections, 
    recommendationsError, 
    isLoadingRecommendations,
    loadMoreRecommendations
  ]);
  
  // Toggle encryption - memoized
  const handleEncryptionToggle = useCallback(() => {
    const newValue = !encryptionEnabled;
    setEncryptionEnabled(newValue);
    updatePrivacySetting('encryptMessages', newValue);
  }, [encryptionEnabled, setEncryptionEnabled, updatePrivacySetting]);
  
  // FAB handler - memoized
  const handleFabPress = useCallback(() => {
    if (activeTab === 'connections') {
      router.push('/screens/scan-business-card');
    } else {
      router.push('/screens/ChatScreen');
    }
  }, [activeTab, router]);
  
  // Tab selection handler - memoized
  const handleTabPress = useCallback((tab: 'connections' | 'pending' | 'suggested' | 'discover') => {
    setActiveTab(tab);
  }, []);
  
  // Loading state based on active tab
  const isCurrentTabLoading = useMemo(() => {
    if (activeTab === 'suggested') {
      return isLoadingRecommendations;
    }
    return isLoading;
  }, [activeTab, isLoading, isLoadingRecommendations]);
  
  // Create header right content
  const headerRightContent = (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => router.push('/screens/settings')}
    >
      <MaterialIcons name="settings" size={22} color="#FFF" />
    </TouchableOpacity>
  );
  
  // Create search bar content
  const searchBarContent = (
    <View style={styles.searchBar}>
      <MaterialIcons name="search" size={22} color={COLORS.secondaryText} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search connections..."
        placeholderTextColor={COLORS.secondaryText}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );
  
  return (
    <ScreenWrapper
      backgroundColor={COLORS.background}
      statusBarStyle="light-content"
      header={{
        title: 'Connections',
        subtitle: 'Grow your network',
        rightContent: headerRightContent,
        gradientColors: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd]
      }}
      withSearchBar={true}
      searchBarContent={searchBarContent}
    >
      <View style={styles.container}>
        {/* Custom dark themed tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'connections' && styles.activeTab
            ]}
            onPress={() => handleTabPress('connections')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'connections' && styles.activeTabText
            ]}>Connected</Text>
            {activeTab === 'connections' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'pending' && styles.activeTab
            ]}
            onPress={() => handleTabPress('pending')}
          >
            <View style={styles.tabContent}>
              <Text style={[
                styles.tabText,
                activeTab === 'pending' && styles.activeTabText
              ]}>Pending</Text>
              {pendingConnections.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingConnections.length}</Text>
                </View>
              )}
            </View>
            {activeTab === 'pending' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'suggested' && styles.activeTab
            ]}
            onPress={() => handleTabPress('suggested')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'suggested' && styles.activeTabText
            ]}>Suggested</Text>
            {activeTab === 'suggested' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'discover' && styles.activeTab
            ]}
            onPress={() => handleTabPress('discover')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'discover' && styles.activeTabText
            ]}>Discover</Text>
            {activeTab === 'discover' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {isCurrentTabLoading ? (
            <LoadingIndicator message={activeTab === 'suggested' ? "Loading suggestions..." : "Loading connections..."} />
          ) : (
            <Animated.FlatList
              data={dataSource}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              ListEmptyComponent={
                recommendationsError && activeTab === 'suggested' ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {recommendationsError}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => fetchRecommendations(true)}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <EmptyState
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    syncContacts={syncContacts}
                    oauthSignIn={oauthSignIn}
                    oauthLoading={oauthLoading}
                  />
                )
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primaryGradientStart}
                  colors={[COLORS.primaryGradientStart]}
                />
              }
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ?
                  <LoadingIndicator small message="Loading more..." /> :
                  null
              }
              testID="connections-list"
            />
          )}
        </View>
        
        <FloatingActionButton
          onPress={handleFabPress}
          icon={activeTab === 'connections' ? "qr-code-scanner" : "chat"}
        />
        
        {encryptionEnabled && (
          <EncryptionIndicator 
            enabled={encryptionEnabled} 
            onToggle={handleEncryptionToggle}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    marginBottom: 16, // Add spacing between cards
  },
  contentContainer: {
    flex: 1,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...createShadow(10),
  },
  searchInput: {
    flex: 1,
    paddingLeft: 12, // Changed from marginLeft to paddingLeft for consistent alignment
    fontSize: 16,
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
    gap: 2, // Added small gap between tabs
  },
  tab: {
    flex: 1,
    paddingVertical: 16, // Increased from 12 to 16 for better touch targets
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Added gap between text and badge
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondaryText,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabBadge: {
    backgroundColor: COLORS.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16, // Added gap between list items for better spacing
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});