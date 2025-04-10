import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '../../services/eventServices';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { getEventColor, createShadow } from './utils/uiHelpers';

interface FeaturedEventProps {
  event: Event;
  daysUntil: string;
  fadeAnim: Animated.Value;
  translateY: Animated.Value;
}

/**
 * FeaturedEvent component - displays the featured event at the top of the home screen
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const FeaturedEvent = ({
  event,
  daysUntil,
  fadeAnim,
  translateY
}: FeaturedEventProps) => {
  if (!event) return null;
  
  const { width } = Dimensions.get('window');
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }]
      }}
    >
      <TouchableOpacity
        style={styles.featuredContainer}
        onPress={() => router.push(`/screens/eventdetails?id=${event.id}`)}
        activeOpacity={0.8}
        // Add accessibility props
        accessible={true}
        accessibilityLabel={`Featured event: ${event.title} on ${formatDate(event.date)}`}
        accessibilityRole="button"
        accessibilityHint="Opens featured event details"
      >
        {event.imageUrl ? (
          <Image 
            source={{ uri: event.imageUrl }} 
            style={styles.featuredImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.featuredImage, { backgroundColor: getEventColor(event.title) }]}>
            <Text style={styles.featuredImageText}>{event.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}
        />
        
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
          
          <View style={styles.featuredDetailsRow}>
            <View style={styles.featuredDetail}>
              <FontAwesome name="calendar" size={16} color="#FFF" />
              <Text style={styles.featuredDetailText}>{formatDate(event.date)}</Text>
            </View>
            <View style={styles.featuredDetail}>
              <FontAwesome name="clock-o" size={16} color="#FFF" />
              <Text style={styles.featuredDetailText}>{formatTime(event.date)}</Text>
            </View>
          </View>
          
          <View style={styles.featuredCountdown}>
            <Text style={styles.featuredCountdownText}>
              {daysUntil} until event
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  featuredContainer: {
    width: Dimensions.get('window').width - 32,
    height: 200,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
    marginBottom: 16,
    ...cardShadow,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImageText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    borderRadius: 16,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuredDetailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featuredDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredDetailText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 14,
  },
  featuredCountdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  featuredCountdownText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(FeaturedEvent);