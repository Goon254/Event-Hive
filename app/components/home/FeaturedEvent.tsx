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
 * Styled to match the app design in the screenshot
 */
const FeaturedEvent = ({
  event,
  daysUntil,
  fadeAnim,
  translateY
}: FeaturedEventProps) => {
  if (!event) return null;
  
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
        {/* Background - Either image or color with letter */}
        <View style={styles.backgroundContainer}>
          {event.imageUrl ? (
            <Image 
              source={{ uri: event.imageUrl }} 
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.backgroundFill, { backgroundColor: getEventColor(event.title) }]}>
              <Text style={styles.eventLetter}>{event.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Featured Badge */}
        <View style={styles.featuredBadgeContainer}>
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>

        {/* Event Content - Overlaid on the image */}
        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <FontAwesome name="calendar" size={16} color="#FFF" style={styles.icon} />
              <Text style={styles.detailText}>{formatDate(event.date)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <FontAwesome name="clock-o" size={16} color="#FFF" style={styles.icon} />
              <Text style={styles.detailText}>
                {event.time ? formatTime(event.time) : formatTime(event.date)}
              </Text>
            </View>
          </View>
          
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {daysUntil ? `${daysUntil} until event` : 'Coming soon'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  featuredContainer: {
    width: '98%',
    height: 230, // Increased height to match second screenshot
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f44336', // Default red color, will be overridden
  },
  eventLetter: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuredBadgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  countdownContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  countdownText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  }
});

export default memo(FeaturedEvent);