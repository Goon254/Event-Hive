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
import { formatDate, formatTime, toDateObject } from '../../utils/dateUtils';
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
        accessible={true}
        accessibilityLabel={`Featured event: ${event.title} on ${formatDate(event.date)}`}
        accessibilityRole="button"
        accessibilityHint="Opens featured event details"
        testID={`featured-event-${event.id}`}
      >
        <View style={styles.imageContainer}>
          {event.imageUrl ? (
            <Image 
              source={{ uri: event.imageUrl }} 
              style={styles.featuredImage}
              resizeMode="cover"
              onError={(e) => {
                console.log('Featured image loading error:', e.nativeEvent.error);
              }}
            />
          ) : (
            <View style={[styles.featuredImage, { backgroundColor: getEventColor(event.title) }]}>
              <Text style={styles.featuredImageText}>{event.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.featuredGradient}
          />
        </View>
        
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
          
          <View style={styles.featuredDetailsRow}>
            <View style={styles.featuredDetail}>
              <FontAwesome name="calendar" size={16} color="#FFF" />
              <Text style={styles.featuredDetailText}>
                {formatDate(event.date)}
              </Text>
            </View>
            <View style={styles.featuredDetail}>
              <FontAwesome name="clock-o" size={16} color="#FFF" />
              <Text style={styles.featuredDetailText}>
                {event.time ? formatTime(event.time) : formatTime(event.date)}
              </Text>
            </View>
          </View>
          
          <View style={styles.featuredCountdown}>
            <Text style={styles.featuredCountdownText}>
              {daysUntil ? `${daysUntil} until event` : 'Coming soon'}
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
    width: '100%', // Changed from fixed width for better responsiveness
    height: 280, // Further increased height for better visibility
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A', // Lighter background for better contrast with text
    position: 'relative',
    borderWidth: 1,
    borderColor: '#3B82F6', // Add border to make it more visible
    ...cardShadow,
    elevation: 8, // Add elevation for Android
    marginBottom: 5, // Add margin to prevent clipping shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#1A1A1A', // Add background color while image loads
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)', // Subtle separator
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A', // Add background color while image loads
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)', // Add subtle border
    resizeMode: 'cover', // Ensure image covers the area properly
  },
  featuredImageText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
  },
  debugText: {
    fontSize: 12,
    color: 'white',
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 3,
    borderRadius: 3,
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '95%', // Further increased height for better text visibility
    borderRadius: 16,
    opacity: 0.95, // Slightly more opaque for better contrast
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Even darker semi-transparent background for better text visibility
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)', // More visible separator
  },
  featuredBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  featuredDetailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Even darker semi-transparent background for better text visibility
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // More visible border
  },
  featuredDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredDetailText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  featuredCountdown: {
    backgroundColor: 'rgba(59, 130, 246, 0.6)', // Even stronger blue tint for better visibility
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // More visible border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  featuredCountdownText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(FeaturedEvent);