// app/components/connections/ConnectionCard.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EnhancedConnection, ConnectionStatus } from '../../models/connection/types';
import { createShadow } from '../../utils/platformUtils';

interface ConnectionCardProps {
  item: EnhancedConnection;
  activeTab: 'connections' | 'pending' | 'suggested' | 'discover';
  handleConnect: (id: string, action: 'accept' | 'reject' | 'connect' | 'message') => void;
  // Pass only the specific unread count for this connection instead of the entire object
  unreadCount?: number;
  // Pass only the specific privacy settings needed instead of the entire object
  showOnlineStatus?: boolean;
  onMessagePress?: () => void;
}

/**
 * Connection card component
 * Displays a single connection with user info and action buttons
 */
const ConnectionCard: React.FC<ConnectionCardProps> = ({
  item,
  activeTab,
  handleConnect,
  unreadCount,
  showOnlineStatus,
  onMessagePress
}) => {
  const router = useRouter();
  const connectionId = item.connectionId || item.userId;
  
  // Handle action button press
  const handleAction = (action: 'accept' | 'reject' | 'connect' | 'message') => {
    handleConnect(connectionId, action);
    
    // If message action, navigate to message screen
    if (action === 'message') {
      if (onMessagePress) {
        onMessagePress();
      } else {
        // Fallback to default behavior
        router.push({
          pathname: '/screens/personal-information',
          params: { userId: connectionId }
        });
      }
    }
  };
  
  // Render action buttons based on active tab
  const renderActionButtons = () => {
    if (activeTab === 'pending') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAction('accept')}
            accessibilityLabel="Accept connection"
            accessibilityRole="button"
          >
            <MaterialIcons name="check" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleAction('reject')}
            accessibilityLabel="Reject connection"
            accessibilityRole="button"
          >
            <MaterialIcons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === 'suggested' || activeTab === 'discover') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.connectButton]}
            onPress={() => handleAction('connect')}
            accessibilityLabel="Connect"
            accessibilityRole="button"
          >
            <MaterialIcons name="person-add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.messageButton]}
            onPress={() => handleAction('message')}
            accessibilityLabel="Message"
            accessibilityRole="button"
          >
            <MaterialIcons name="chat" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.connectionCard}
      onPress={() => router.push({
        pathname: '/screens/personal-information',
        params: { userId: connectionId }
      })}
      activeOpacity={0.9}
      accessibilityLabel={`${item.name}'s profile`}
      accessibilityRole="button"
      testID={`connection-card-${connectionId}`}
    >
      <View style={styles.connectionContent}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image 
              source={{ uri: item.avatar }} 
              style={styles.avatar}
              accessibilityLabel={`${item.name}'s avatar`}
              testID="connection-avatar"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {showOnlineStatus && item.isOnline && (
            <View style={styles.onlineIndicator} testID="online-indicator" />
          )}
        </View>
        
        <View style={styles.connectionInfo}>
          <Text style={styles.name} testID="connection-name">{item.name}</Text>
          {item.role && <Text style={styles.role}>{item.role}</Text>}
          
          {/* Mutual connections */}
          {item.mutualConnections !== undefined && (
            <View style={styles.mutualContainer}>
              <Ionicons name="people" size={14} color="#6B7280" />
              <Text style={styles.mutualText}>
                {typeof item.mutualConnections === 'number' ? item.mutualConnections : item.mutualConnections?.length} mutual connection{(typeof item.mutualConnections === 'number' ? item.mutualConnections : item.mutualConnections?.length) !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {/* Recent event */}
          {item.recentEvent && (
            <View style={styles.eventContainer}>
              <MaterialIcons name="event" size={14} color="#6B7280" />
              <Text style={styles.eventText} numberOfLines={1}>
                Last seen at: {item.recentEvent}
              </Text>
            </View>
          )}
          
          {/* Recommendation reason */}
          {item.recommendationReason && (
            <View style={styles.recommendationContainer}>
              <MaterialIcons name="lightbulb" size={14} color="#6B7280" />
              <Text style={styles.recommendationText} numberOfLines={1}>
                {item.recommendationReason}
              </Text>
            </View>
          )}
          
          {/* Unread messages badge */}
          {unreadCount && unreadCount > 0 && (
            <View style={styles.unreadBadge} testID="unread-badge">
              <Text style={styles.unreadBadgeText}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {renderActionButtons()}
    </TouchableOpacity>
  );
};

// Create platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...cardShadow,
  },
  connectionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  connectionInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  mutualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  mutualText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...buttonShadow,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  messageButton: {
    backgroundColor: '#3B82F6',
  },
  connectButton: {
    backgroundColor: '#8B5CF6',
  },
});

// Use memo with custom comparison function to prevent unnecessary re-renders
export default memo(ConnectionCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.showOnlineStatus === nextProps.showOnlineStatus
  );
});