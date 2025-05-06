// components/connections/ConnectionRow.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/constants';

/**
 * Constants for the updated color scheme
 */
const updatedColors = {
  background: '#FEF3C7', 
  card: '#FFFBEB',
  primary: '#F97316',
  secondaryText: '#6B7280',
  text: '#111827',
  border: '#FCD34D',
  primaryGradientStart: '#F97316',
  primaryGradientEnd: '#FDBA74',
  error: '#DC2626',
  primaryDark: '#EA580C'
};

type ConnectionRowProps = {
  item: any;
  type: 'connection' | 'pending' | 'suggestion' | 'contact';
  onAction: () => void;
  onDismiss?: () => void;
  actionLabel: string;
  isLoading?: boolean;
  showVibeTags?: boolean;
  showSharedEvents?: boolean;
  showOnlineStatus?: boolean;
};

/**
 * A reusable row component for displaying connection information
 */
const ConnectionRow: React.FC<ConnectionRowProps> = ({
  item,
  type,
  onAction,
  onDismiss,
  actionLabel,
  isLoading = false,
  showVibeTags = false,
  showSharedEvents = false,
  showOnlineStatus = false
}) => {
  // Generate emoji for events (example mapping)
  const eventEmojis: { [key: string]: string } = {
    concert: '🎵',
    sports: '🏀',
    conference: '🎤',
    party: '🎉',
    dinner: '🍽️',
    coffee: '☕',
    meeting: '💼',
    festival: '🎭',
    travel: '✈️',
    outdoor: '🏞️'
  };

  // Extract shared events (if available)
  const sharedEvents = item.sharedEvents || [];
  
  // Extract vibe tags (if available)
  const vibeTags = item.vibeTags || [];
  
  // Handle online status
  const isOnline = item.isOnline && showOnlineStatus;
  
  // Format mutual connections/events text
  const getMutualText = () => {
    if (type === 'suggestion' || type === 'contact') {
      const mutualCount = item.mutualConnections || 0;
      if (mutualCount > 0) {
        return `${mutualCount} mutual connection${mutualCount > 1 ? 's' : ''}`;
      }
    }
    
    if (showSharedEvents && sharedEvents.length > 0) {
      return `${sharedEvents.length} shared event${sharedEvents.length > 1 ? 's' : ''}`;
    }
    
    return '';
  };

  return (
    <View style={styles.container}>
      {/* Avatar with online indicator */}
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: item.avatar || 'https://via.placeholder.com/60' }} 
          style={styles.avatar} 
        />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      {/* Connection info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name || 'Unknown'}</Text>
        
        {/* Mutual text */}
        {getMutualText() ? (
          <Text style={styles.mutualText}>{getMutualText()}</Text>
        ) : null}
        
        {/* Vibe tags */}
        {showVibeTags && vibeTags.length > 0 && (
          <View style={styles.tagContainer}>
            {vibeTags.slice(0, 3).map((tag: string, index: number) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {vibeTags.length > 3 && (
              <Text style={styles.moreText}>+{vibeTags.length - 3}</Text>
            )}
          </View>
        )}
        
        {/* Shared event indicators */}
        {showSharedEvents && sharedEvents.length > 0 && (
          <View style={styles.eventContainer}>
            {sharedEvents.slice(0, 3).map((event: any, index: number) => {
              const eventType = event.type || 'meeting';
              const emoji = eventEmojis[eventType] || '📅';
              
              return (
                <View key={index} style={styles.eventBadge}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </View>
              );
            })}
            {sharedEvents.length > 3 && (
              <Text style={styles.moreText}>+{sharedEvents.length - 3}</Text>
            )}
          </View>
        )}
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionContainer}>
        {type === 'suggestion' && onDismiss ? (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={onDismiss}
            disabled={isLoading}
          >
            <MaterialIcons name="close" size={18} color={COLORS.secondaryText} />
          </TouchableOpacity>
        ) : null}
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            type === 'pending' ? styles.pendingActionButton : null,
            type === 'contact' || type === 'suggestion' ? styles.connectActionButton : null
          ]}
          onPress={onAction}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionText}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(253, 186, 116, 0.2)',  // Updated border color with opacity
    backgroundColor: updatedColors.card,
    marginBottom: 8,
    borderRadius: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E', // Green for online
    borderWidth: 2,
    borderColor: updatedColors.card,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: updatedColors.text,
    marginBottom: 2,
  },
  mutualText: {
    fontSize: 14,
    color: updatedColors.secondaryText,
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)', // primary color with opacity
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: updatedColors.primary,
  },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(252, 211, 77, 0.2)', // border color with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  emojiText: {
    fontSize: 16,
  },
  moreText: {
    fontSize: 12,
    color: updatedColors.secondaryText,
    marginLeft: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: updatedColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  pendingActionButton: {
    backgroundColor: updatedColors.primary,
  },
  connectActionButton: {
    backgroundColor: updatedColors.primary,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});