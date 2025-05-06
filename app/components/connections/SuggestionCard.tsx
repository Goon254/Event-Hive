// app/components/connections/SuggestionCard.tsx
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EnhancedConnection } from '../../models/connection/types';
import { createShadow } from '../../utils/platformUtils';
import { COLORS } from '../../theme/constants';

interface SuggestionCardProps {
  item: EnhancedConnection;
  handleConnect: (id: string, action: 'connect' | 'dismiss') => void;
  isConnecting?: boolean;
}

/**
 * SuggestionCard component
 * Displays a single connection suggestion with user info and action buttons
 */
const SuggestionCard: React.FC<SuggestionCardProps> = memo(({
  item,
  handleConnect,
  isConnecting = false,
}) => {
  const router = useRouter();
  const connectionId = item.connectionId || item.userId;
  
  // Define valid icon names
  type IconName = 'people' | 'business' | 'location-on' | 'favorite' | 'lightbulb';
  
  // Calculate how to display the recommendation reason
  const getRecommendationDisplay = (): { icon: IconName; text: string } => {
    if (typeof item.mutualConnections === 'number' && item.mutualConnections > 0) {
      return {
        icon: 'people',
        text: `${item.mutualConnections} mutual connection${item.mutualConnections !== 1 ? 's' : ''}`
      };
    }
    
    if (item.recommendationReason?.includes('industry')) {
      return {
        icon: 'business',
        text: item.recommendationReason
      };
    }
    
    if (item.recommendationReason?.includes('location')) {
      return {
        icon: 'location-on',
        text: item.recommendationReason
      };
    }
    
    if (item.recommendationReason?.includes('interest')) {
      return {
        icon: 'favorite',
        text: item.recommendationReason
      };
    }
    
    return {
      icon: 'lightbulb',
      text: item.recommendationReason || 'Suggested for you'
    };
  };
  
  const recommendation = getRecommendationDisplay();
  
  return (
    <View style={styles.card} testID={`suggestion-card-${connectionId}`}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => router.push({
          pathname: '/screens/personal-information',
          params: { userId: connectionId }
        })}
        accessibilityLabel={`View ${item.name}'s profile`}
        accessibilityRole="button"
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
              accessibilityLabel={`${item.name}'s avatar`}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          
          {item.role && (
            <Text style={styles.role} numberOfLines={1} ellipsizeMode="tail">
              {item.role}
            </Text>
          )}
          
          <View style={styles.recommendationContainer}>
            <MaterialIcons name={recommendation.icon} size={14} color={COLORS.secondaryText} />
            <Text style={styles.recommendationText}>
              {recommendation.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.connectButton]}
          onPress={() => handleConnect(connectionId, 'connect')}
          disabled={isConnecting}
          accessibilityLabel={`Connect with ${item.name}`}
          accessibilityRole="button"
          testID={`connect-button-${connectionId}`}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="person-add" size={16} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.dismissButton]}
          onPress={() => handleConnect(connectionId, 'dismiss')}
          disabled={isConnecting}
          accessibilityLabel={`Dismiss suggestion for ${item.name}`}
          accessibilityRole="button"
          testID={`dismiss-button-${connectionId}`}
        >
          <MaterialIcons name="close" size={16} color={COLORS.secondaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    ...createShadow(1),
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginBottom: 4,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
  },
  actionButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    marginRight: 8,
    flex: 1,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  dismissButton: {
    backgroundColor: COLORS.border,
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 0,
  },
});

export default SuggestionCard;