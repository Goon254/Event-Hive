// components/home/FeaturedEvent.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createShadow } from '../../utils/platformUtils';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

// Updated FeaturedEvent to match feed styling
interface FeaturedEventProps {
  event: any;
  daysUntil: number;
  fadeAnim: any;
  translateY: any;
  theme: { primaryGradientStart: string; primaryGradientEnd: string; secondaryText: string };
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({ event, daysUntil, fadeAnim, translateY, theme }) => {
  // Format date for display
  const formatEventDate = (date: any) => {
    if (!date) return 'Date TBD';
    const eventDate = new Date(date);
    return format(eventDate, 'EEEE, MMMM d • h:mm a');
  };

  // Format countdown text
  const getCountdownText = () => {
    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow!';
    if (daysUntil < 0) return 'Past event';
    return `In ${daysUntil} days`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={() => router.push({
        pathname: '/screens/EventDetail',
        params: { eventId: event.id },
      })}
    >
      {/* Background image for consistent design aesthetic */}
      <Image
        source={require('../../../assets/images/tropical-gradient.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Featured Event Image */}
      <View style={styles.imageContainer}>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              style={styles.placeholderGradient}
            >
              <FontAwesome name="star" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        
        {/* Featured badge */}
        <View style={styles.featuredBadge}>
          <MaterialIcons name="star" size={16} color="#FFFFFF" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
        
        {/* Countdown badge */}
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>{getCountdownText()}</Text>
        </View>
      </View>
      
      {/* Event details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        
        <View style={styles.dateTimeContainer}>
          <MaterialIcons name="event" size={18} color={theme.secondaryText} />
          <Text style={styles.dateTimeText}>
            {formatEventDate(event.date)}
          </Text>
        </View>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={18} color={theme.secondaryText} />
          <Text style={styles.locationText} numberOfLines={1}>
            {event.location || 'Location TBD'}
          </Text>
        </View>
        
        <View style={styles.statsRow}>
          {event.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
          )}
          
          <View style={styles.attendeesContainer}>
            <MaterialIcons name="people" size={18} color={theme.secondaryText} />
            <Text style={styles.attendeesText}>
              {event.attendees || 0} attending
            </Text>
          </View>
        </View>
        
        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push({
            pathname: '/screens/RSVP',
            params: { eventId: event.id },
          })}
        >
          <LinearGradient
            colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              RSVP Now
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    ...createShadow(2),
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.1,
    zIndex: 0,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  countdownBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countdownText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  ctaButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...createShadow(1),
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});

export default FeaturedEvent;