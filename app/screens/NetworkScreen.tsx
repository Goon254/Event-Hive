// app/screens/NetworkScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useEventConnections } from '../hooks/useEventConnections';
import EventConnectionCard from '../components/EventConnectionCard';
import { EnhancedConnection } from '../models/connection/types';

/**
 * Screen for displaying network connections
 * This is a streamlined version that only shows connections from events
 */
export default function NetworkScreen({ user }: { user: any }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'suggestions'>('connections');
  
  const {
    connections,
    pendingConnections,
    potentialConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
  } = useEventConnections(user);
  
  // Render a connection item
  const renderConnectionItem = useCallback(({ item }: { item: EnhancedConnection }) => (
    <EventConnectionCard
      connection={item}
      currentUserId={user.id}
      onConnect={handleConnect}
      isAccepted={true}
    />
  ), [user, handleConnect]);
  
  // Render a pending connection item
  const renderPendingItem = useCallback(({ item }: { item: EnhancedConnection }) => (
    <EventConnectionCard
      connection={item}
      currentUserId={user.id}
      onConnect={handleConnect}
      isPending={true}
    />
  ), [user, handleConnect]);
  
  // Render a suggestion item
  const renderSuggestionItem = useCallback(({ item }: { item: EnhancedConnection }) => (
    <EventConnectionCard
      connection={item}
      currentUserId={user.id}
      onConnect={handleConnect}
    />
  ), [user, handleConnect]);
  
  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    
    let message = '';
    
    switch (activeTab) {
      case 'connections':
        message = 'You have no connections yet. Connect with people from events you\'ve attended.';
        break;
      case 'requests':
        message = 'You have no pending connection requests.';
        break;
      case 'suggestions':
        message = 'No connection suggestions available. Try attending more events to meet people.';
        break;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      </View>
    );
  }, [isLoading, activeTab, theme]);
  
  // Render the appropriate list based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'connections':
        return (
          <FlatList
            data={connections}
            renderItem={renderConnectionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
          />
        );
      case 'requests':
        return (
          <FlatList
            data={pendingConnections}
            renderItem={renderPendingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
          />
        );
      case 'suggestions':
        return (
          <FlatList
            data={potentialConnections}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
          />
        );
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>My Network</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Connect with people from events you've attended
        </Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'connections' && { 
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            }
          ]}
          onPress={() => setActiveTab('connections')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'connections' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            My Connections
          </Text>
          {connections.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                {connections.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' && { 
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            }
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'requests' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Requests
          </Text>
          {pendingConnections.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                {pendingConnections.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'suggestions' && { 
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            }
          ]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'suggestions' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Suggestions
          </Text>
          {potentialConnections.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                {potentialConnections.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});