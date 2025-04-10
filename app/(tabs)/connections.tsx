// app/(tabs)/connections.tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, RefreshControl, StatusBar } from 'react-native';
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
    suggestedConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
    unreadMessages,
    isLoadingMore,
    hasMoreConnections,
    loadMoreConnections
  } = useConnections(user as any);
  
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
        />
      );
    }
  };
  
  return (
    <View style={styles.container} testID="connections-screen">
      <StatusBar barStyle="dark-content" />
      
      <Header 
        scrollY={scrollY} 
        pendingCount={pendingConnections.length} 
        onSettingsPress={() => router.push('/screens/settings')}
      />
      
      <SearchBar 
        value={searchQuery} 
        onChangeText={setSearchQuery} 
      />
      
      <ConnectionTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingCount={pendingConnections.length} 
      />
      
      {isLoading ? (
        <LoadingIndicator message="Loading connections..." />
      ) : (
        <Animated.FlatList
          data={getDataSource()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              syncContacts={syncContacts}
              oauthSignIn={oauthSignIn}
              oauthLoading={oauthLoading}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onEndReached={hasMoreConnections ? loadMoreConnections : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore ? <LoadingIndicator small message="Loading more..." /> : null}
          testID="connections-list"
        />
      )}
      
      <FloatingActionButton 
        onPress={() => router.push('/screens/scan-business-card')}
        icon="qr-code-scanner"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
});
