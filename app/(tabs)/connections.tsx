// app/(tabs)/connections.tsx
import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../theme/constants';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  Text,
  Platform,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenLayout from '../components/common/ScreenLayout';
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
import { useChat } from '../services/chatService';

// Components
import Header from '../components/connections/Header';
import SearchBar from '../components/common/SearchBar';
import ConnectionTabs from '../components/connections/ConnectionTabs';
import ConnectionCard from '../components/connections/ConnectionCard';
import ContactMatchCard from '../components/connections/ContactMatchCard';
import EmptyState from '../components/connections/EmptyState';
import LoadingIndicator from '../components/common/LoadingIndicator';
import FloatingActionButton from '../components/common/FloatingActionButton';
import EncryptionIndicator from '../components/connections/EncryptionIndicator';

/**
 * Connections Screen
 * Main screen for managing user connections
 */
export default function ConnectionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // UI state
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'suggested' | 'discover'>('connections');
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Custom hooks
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
  } = useConnections(user as any);
  
  // Recommendations hook
  const {
    recommendations: suggestedConnections,
    isLoading: isLoadingRecommendations,
    loadMoreRecommendations,
    error: recommendationsError,
    fetchRecommendations
  } = useRecommendations(user as any);
  
  // Chat hook for unread messages
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({});
  
  // Load unread message counts
  useEffect(() => {
    if (!user) return;
    
    const loadUnreadCounts = async () => {
      try {
        // This would be replaced with actual API call in production
        // Get chatService
        const { chatService } = require('../services/chatService');
        const totalUnread = await chatService.getTotalUnreadCount(user.id);
        
        // For demo purposes, distribute unread counts among connections
        const unreadCounts: {[key: string]: number} = {};
        
        if (connections.length > 0 && totalUnread > 0) {
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
        }
        
        setUnreadMessages(unreadCounts);
      } catch (error) {
        console.error('Error loading unread counts:', error);
      }
    };
    
    loadUnreadCounts();
  }, [user, connections]);
  
  const { 
    searchQuery, 
    setSearchQuery, 
    filteredConnections,
    filteredPendingConnections,
    filteredSuggestedConnections
  } = useSearch(connections, pendingConnections, suggestedConnections);
  
  const { isConnected: _isConnected } = useWebSocket(user?.id || null);
  const { encryptionEnabled, setEncryptionEnabled } = useEncryption(user as any);
  const { contactMatches, syncContacts, filteredContactMatches } = useContactSync(user as any, searchQuery);
  const { oauthSignIn, oauthLoading } = useOAuth(user as any);
  const { privacySettings, updatePrivacySetting } = usePrivacySettings(user as any);
  
  // Get data source based on active tab
  const getDataSource = () => {
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
  };
  
  // Render item based on active tab
  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'discover' && 'phoneNumber' in item) {
      return (
        <ContactMatchCard
          item={item}
          onConnect={handleConnect}
        />
      );
    } else {
      return (
        <ConnectionCard
          item={item}
          activeTab={activeTab}
          handleConnect={handleConnect}
          unreadMessages={unreadMessages}
          privacySettings={privacySettings}
          onMessagePress={() => {
            router.push({
              pathname: '/screens/ChatScreen',
              params: {
                userId: item.connectionId || item.userId,
                name: item.name,
                avatar: item.avatar || ''
              }
            });
          }}
        />
      );
    }
  };
  
  return (
    <ScreenLayout
      backgroundColor={COLORS.background}
      statusBarColor={COLORS.background}
      statusBarStyle="light-content"
      testID="connections-screen"
    >
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        {
          height: Platform.OS === 'ios' ? 130 : 110,
        }
      ]}>
        <LinearGradient
          colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Connections</Text>
              <Text style={styles.subtitleText}>
                Grow your network
              </Text>
            </View>
            
            <View style={styles.headerButtons}>
              {pendingConnections.length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingConnections.length}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/screens/settings')}
              >
                <MaterialIcons name="settings" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      <View style={{ marginTop: 100 }}>
        {/* Custom dark themed search bar */}
        <View style={styles.searchBarContainer}>
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
        </View>
        
        {/* Custom dark themed tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'connections' && styles.activeTab
            ]}
            onPress={() => setActiveTab('connections')}
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
            onPress={() => setActiveTab('pending')}
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
            onPress={() => setActiveTab('suggested')}
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
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'discover' && styles.activeTabText
            ]}>Discover</Text>
            {activeTab === 'discover' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading || isLoadingRecommendations ? (
        <LoadingIndicator message={activeTab === 'suggested' ? "Loading suggestions..." : "Loading connections..."} />
      ) : (
        <Animated.FlatList
          data={getDataSource()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View>
              {recommendationsError && activeTab === 'suggested' ? (
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
              )}
            </View>
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
          onEndReached={() => {
            if (activeTab === 'connections' && hasMoreConnections) {
              loadMoreConnections();
            } else if (activeTab === 'suggested' && !recommendationsError) {
              loadMoreRecommendations();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ?
              <LoadingIndicator small message="Loading more..." /> :
              null
          }
          testID="connections-list"
        />
      )}
      
      <FloatingActionButton
        onPress={() => {
          if (activeTab === 'connections') {
            router.push('/screens/scan-business-card');
          } else {
            // Navigate to chat screen if in connections tab
            router.push('/screens/ChatScreen');
          }
        }}
        icon={activeTab === 'connections' ? "qr-code-scanner" : "chat"}
      />
      
      {encryptionEnabled && (
        <EncryptionIndicator 
          enabled={encryptionEnabled} 
          onToggle={() => {
            setEncryptionEnabled(!encryptionEnabled);
            updatePrivacySetting('encryptMessages', !encryptionEnabled);
          }} 
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...createShadow(2),
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // Enhanced Header - no borders or outlines
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, // Adjusted to account for status bar spacer
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30, // Extra padding at bottom
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 32, // Larger text
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 18, // Larger text
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16, // Increased spacing
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48, // Slightly larger
    height: 48, // Slightly larger
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: COLORS.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 100, // Add space for the header
    paddingBottom: 100,
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
