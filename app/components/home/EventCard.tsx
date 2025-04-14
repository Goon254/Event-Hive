import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '../../services/eventServices';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatDate, formatTime, toDateObject } from '../../utils/dateUtils';
import { getEventColor, createShadow } from './utils/uiHelpers';
import { useFeatureFlags } from '../../utils/featureFlags';

interface EventCardProps {
  item: Event;
  index: number;
  isAttending: boolean;
  status: string;
  fadeValue: Animated.Value;
  translateValue: Animated.Value;
}

/**
 * EventCard component - displays an event in a card format
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const EventCard = ({
  item,
  index,
  isAttending,
  status,
  fadeValue,
  translateValue
}: EventCardProps) => {
  const colorScheme = useColorScheme();
  const { isEnabled } = useFeatureFlags();
  const showPrivacyControls = isEnabled('NEW_EVENT_PRIVACY');
  
  // Render privacy indicator based on event privacy level
  const renderPrivacyIndicator = () => {
    if (!showPrivacyControls) return null;
    
    switch(item.privacyLevel) {
      case 'private':
        return (
          <View style={styles.privacyBadge}>
            <FontAwesome name="lock" size={12} color="#FFF" />
            <Text style={styles.privacyText}>Private</Text>
          </View>
        );
      case 'connections':
        return (
          <View style={styles.privacyBadge}>
            <FontAwesome name="users" size={12} color="#FFF" />
            <Text style={styles.privacyText}>Connections</Text>
          </View>
        );
      default:
        return (
          <View style={styles.privacyBadge}>
            <FontAwesome name="globe" size={12} color="#FFF" />
            <Text style={styles.privacyText}>Public</Text>
          </View>
        );
    }
  };
  
  // Render publish status indicator
  const renderPublishStatus = () => {
    if (!showPrivacyControls) return null;
    
    switch(item.publishStatus) {
      case 'draft':
        return (
          <View style={[styles.publishStatusBadge, { backgroundColor: '#6B7280' }]}>
            <MaterialIcons name="edit" size={12} color="#FFF" />
            <Text style={styles.publishStatusText}>Draft</Text>
          </View>
        );
      case 'scheduled':
        return (
          <View style={[styles.publishStatusBadge, { backgroundColor: '#8B5CF6' }]}>
            <MaterialIcons name="schedule" size={12} color="#FFF" />
            <Text style={styles.publishStatusText}>Scheduled</Text>
          </View>
        );
      default:
        return null; // Don't show badge for published events
    }
  };
  
  return (
    <Animated.View
      style={{
        opacity: fadeValue,
        transform: [{ translateY: translateValue }]
      }}
    >
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${item.title} event on ${formatDate(item.date)}`}
        accessibilityRole="button"
        accessibilityHint="Opens event details"
        testID={`event-card-${item.id}`}
      >
        <View style={styles.eventImageWrapper}>
          {item.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.eventImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.imageGradient}
              />
            </View>
          ) : (
            <View style={[styles.eventImagePlaceholder, { backgroundColor: getEventColor(item.title) }]}>
              <Text style={styles.eventImageText}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          
          {/* Event status badge */}
          <View style={styles.eventStatusBadge}>
            <Text style={styles.eventStatusText}>
              {status.toUpperCase()}
            </Text>
          </View>
          
          {/* Privacy indicator */}
          {renderPrivacyIndicator()}
          
          {/* Publish status indicator */}
          {renderPublishStatus()}
          
          {/* Attending indicator */}
          {isAttending && (
            <View style={styles.attendingBadge}>
              <MaterialIcons name="check-circle" size={16} color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.eventContent}>
          <Text 
            style={styles.eventTitle}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.eventMetaRow}>
              <FontAwesome name="calendar" size={14} color="#007AFF" />
              <Text style={styles.eventMetaText}>
                {formatDate(item.date)}
                {item.time && ` at ${formatTime(item.time)}`}
              </Text>
            </View>
            
            <View style={styles.eventMetaRow}>
              <FontAwesome name="map-marker" size={14} color="#007AFF" />
              <Text
                style={styles.eventMetaText}
                numberOfLines={1}
              >
                {item.location || 'Location TBD'}
              </Text>
            </View>
            
            {item.isPaid && (
              <View style={styles.eventMetaRow}>
                <FontAwesome name="ticket" size={14} color="#007AFF" />
                <Text style={styles.eventMetaText}>
                  ${item.price?.toFixed(2) || '0.00'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  eventCard: {
    width: Dimensions.get('window').width * 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#252525', // Slightly lighter than the main background for better contrast
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#3B82F6', // Add border to make it more visible
    ...cardShadow,
  },
  eventImageWrapper: {
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  eventImage: {
    height: 120,
    width: '100%',
  },
  eventImagePlaceholder: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  eventStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  attendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    borderRadius: 20,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  privacyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  publishStatusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  publishStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  eventContent: {
    padding: 14,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaContainer: {
    marginTop: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventMetaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#a9a9a9',
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(EventCard);