// app/components/connections/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface EmptyStateProps {
  activeTab: 'connections' | 'pending' | 'suggested' | 'discover';
  setActiveTab: (tab: 'connections' | 'pending' | 'suggested' | 'discover') => void;
  syncContacts: () => void;
  oauthSignIn: (provider: string) => void;
  oauthLoading: boolean;
}

/**
 * Empty state component
 * Displays when there are no items to show in the current tab
 */
const EmptyState: React.FC<EmptyStateProps> = ({ 
  activeTab, 
  setActiveTab, 
  syncContacts, 
  oauthSignIn, 
  oauthLoading 
}) => {
  // Get icon based on active tab
  const getIcon = () => {
    switch (activeTab) {
      case 'connections':
        return <Ionicons name="people" size={60} color="#CBD5E1" />;
      case 'pending':
        return <Ionicons name="time" size={60} color="#CBD5E1" />;
      case 'suggested':
        return <Ionicons name="bulb" size={60} color="#CBD5E1" />;
      case 'discover':
        return <Ionicons name="compass" size={60} color="#CBD5E1" />;
      default:
        return <Ionicons name="people" size={60} color="#CBD5E1" />;
    }
  };
  
  // Get title based on active tab
  const getTitle = () => {
    switch (activeTab) {
      case 'connections':
        return 'No connections yet';
      case 'pending':
        return 'No pending requests';
      case 'suggested':
        return 'No suggestions available';
      case 'discover':
        return 'Discover new connections';
      default:
        return 'No connections yet';
    }
  };
  
  // Get message based on active tab
  const getMessage = () => {
    switch (activeTab) {
      case 'connections':
        return 'Start connecting with other attendees and event organizers!';
      case 'pending':
        return 'You don\'t have any pending connection requests.';
      case 'suggested':
        return 'Check back later for personalized connection suggestions.';
      case 'discover':
        return 'Sync your contacts or connect with social networks to find people you know.';
      default:
        return 'Start connecting with other attendees and event organizers!';
    }
  };
  
  // Get provider color
  const getProviderColor = (provider: string): string => {
    switch (provider) {
      case 'google': return '#DB4437';
      case 'facebook': return '#4267B2';
      case 'twitter': return '#1DA1F2';
      case 'linkedin': return '#0077B5';
      default: return '#007AFF';
    }
  };
  
  // Available OAuth providers
  const OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'linkedin'];
  
  return (
    <View style={styles.emptyContainer} testID={`empty-state-${activeTab}`}>
      {getIcon()}
      <Text style={styles.emptyTitle}>{getTitle()}</Text>
      <Text style={styles.emptyText}>{getMessage()}</Text>
      
      {activeTab === 'connections' && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => setActiveTab('suggested')}
          accessibilityLabel="Explore Suggestions"
          accessibilityRole="button"
          testID="explore-suggestions-button"
        >
          <Text style={styles.emptyButtonText}>Explore Suggestions</Text>
        </TouchableOpacity>
      )}
      
      {activeTab === 'discover' && (
        <View style={styles.discoverOptions}>
          <TouchableOpacity 
            style={styles.discoverButton}
            onPress={syncContacts}
            accessibilityLabel="Sync Contacts"
            accessibilityRole="button"
            testID="sync-contacts-button"
          >
            <Ionicons name="people" size={24} color="#FFFFFF" />
            <Text style={styles.discoverButtonText}>Sync Contacts</Text>
          </TouchableOpacity>
          
          {OAUTH_PROVIDERS.map(provider => (
            <TouchableOpacity 
              key={provider}
              style={[styles.discoverButton, { backgroundColor: getProviderColor(provider) }]}
              onPress={() => oauthSignIn(provider)}
              disabled={oauthLoading}
              accessibilityLabel={`Connect ${provider}`}
              accessibilityRole="button"
              testID={`connect-${provider}-button`}
            >
              <FontAwesome5 name={provider} size={24} color="#FFFFFF" />
              <Text style={styles.discoverButtonText}>
                {oauthLoading ? 'Connecting...' : `Connect ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  discoverOptions: {
    width: '100%',
    marginTop: 20,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EmptyState;