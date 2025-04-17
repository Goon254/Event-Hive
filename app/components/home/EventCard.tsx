import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  ImageBackground
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '../../services/eventServices';
import { useColorScheme } from '@/components/useColorScheme';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { getEventColor, createShadow } from './utils/uiHelpers';
import { useFeatureFlags } from '../../utils/featureFlags';

interface EventCardProps {
  item: Event;
  index: number;
  isAttending?: boolean;
  status: string;
  fadeValue?: Animated.Value;
  translateValue?: Animated.Value;
  fullWidth?: boolean;
}

/**
 * Enhanced EventCard component - displays an event with prominent image
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const EventCard = ({
  item,
  index,
  isAttending = false,
  status,
  fadeValue = new Animated.Value(1),
  translateValue = new Animated.Value(0),
  fullWidth = false
}: EventCardProps) => {
  const colorScheme = useColorScheme();
  const { isEnabled } = useFeatureFlags();
  const showPrivacyControls = isEnabled('NEW_EVENT_PRIVACY');
  
  // Calculate responsive card width
  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = fullWidth ? (screenWidth - 32) : (screenWidth * 0.8);
  
  // Generate status colors based on status
  const getStatusColor = () => {
    switch(status.toLowerCase()) {
      case 'upcoming':
        return '#3B82F6'; // Blue
      case 'ongoing': 
        return '#10B981'; // Green
      case 'completed':
        return '#6B7280'; // Gray
      default:
        return '#8B5CF6'; // Purple
    }
  };
  
  // Render badge for privacy level
  const renderPrivacyIndicator = () => {
    if (!showPrivacyControls) return null;
    
    // Map privacy levels to icons with proper typing for FontAwesome
    const privacyIcons: Record<string, { icon: keyof typeof FontAwesome.glyphMap, label: string }> = {
      'private': { icon: 'lock', label: 'Private' },
      'connections': { icon: 'users', label: 'Connections' },
      'public': { icon: 'globe', label: 'Public' }
    };
    
    const privacy = item.privacyLevel || 'public';
    const { icon, label } = privacyIcons[privacy];
    
    return (
      <View style={styles.privacyBadge}>
        <FontAwesome name={icon} size={12} color="#FFF" />
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };
  
  // Determine if event is paid
  const isPaid = item.isPaid && (item.price || 0) > 0;

  return (
    <Animated.View
      style={{
        opacity: fadeValue,
        transform: [{ translateY: translateValue }],
        width: cardWidth,
        marginHorizontal: fullWidth ? 16 : 8
      }}
    >
      <TouchableOpacity
        style={[styles.eventCard, { width: cardWidth }]}
        onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={`${item.title} event on ${formatDate(item.date)}`}
        accessibilityRole="button"
        accessibilityHint="Opens event details"
        testID={`event-card-${item.id}`}
      >
        {/* Background Image */}
        <ImageBackground
          source={item.imageUrl ? { uri: item.imageUrl } : undefined}
          style={[styles.imageBackground, { 
            backgroundColor: item.imageUrl ? undefined : getEventColor(item.title) 
          }]}
          imageStyle={styles.imageStyle}
        >
          {/* Display letter if no image */}
          {!item.imageUrl && (
            <Text style={styles.placeholderText}>
              {item.title.charAt(0).toUpperCase()}
            </Text>
          )}
          
          {/* Overlay gradient for better text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          >
            {/* Top badges and status */}
            <View style={styles.topBadgesContainer}>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
              </View>
              
              {/* Price badge */}
              {isPaid && (
                <View style={styles.priceBadge}>
                  <FontAwesome name="ticket" size={12} color="#FFF" />
                  <Text style={styles.badgeText}>
                    ${item.price?.toFixed(2)}
                  </Text>
                </View>
              )}
              
              {/* Attending badge */}
              {isAttending && (
                <View style={styles.attendingBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#FFF" />
                </View>
              )}
            </View>
            
            {/* Event info at bottom */}
            <View style={styles.eventInfo}>
              {/* Title */}
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              
              {/* Details row */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <FontAwesome name="calendar" size={14} color="#FFF" />
                  <Text style={styles.detailText}>
                    {formatDate(item.date)}
                    {item.time && ` • ${formatTime(item.time)}`}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <FontAwesome name="map-marker" size={14} color="#FFF" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.location || 'Location TBD'}
                  </Text>
                </View>
              </View>
              
              {/* Bottom badges - privacy, etc */}
              <View style={styles.bottomBadgesContainer}>
                {renderPrivacyIndicator()}
                
                {/* Publishing status badge */}
                {showPrivacyControls && item.publishStatus && item.publishStatus !== 'published' && (
                  <View style={[
                    styles.publishBadge, 
                    { backgroundColor: item.publishStatus === 'draft' ? '#6B7280' : '#8B5CF6' }
                  ]}>
                    <MaterialIcons 
                      name={item.publishStatus === 'draft' ? 'edit' : 'schedule'} 
                      size={12} 
                      color="#FFF" 
                    />
                    <Text style={styles.badgeText}>
                      {item.publishStatus === 'draft' ? 'Draft' : 'Scheduled'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  eventCard: {
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
    ...cardShadow,
    elevation: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  placeholderText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    borderRadius: 16,
    justifyContent: 'space-between',
    padding: 12,
  },
  topBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  attendingBadge: {
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  bottomBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  publishBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});

// Use React.memo to prevent unnecessary re-renders
export default memo(EventCard);