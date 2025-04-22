// components/home/EventCard.tsx
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
const CARD_WIDTH = width * 0.75;

// Import the Event type from event services
import { Event as EventType } from '../../services/eventServices';

// Define interfaces for type safety
interface EventItem {
  id: string;
  title: string;
  date?: string | Date;
  location?: string;
  imageUrl?: string;
  category?: string;
  attendees?: string[] | number;
}

// This should match the FilterType from useEventData
type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed';

interface EventStatus {
  label: string;
  color?: string;
}

interface EventTheme {
  primaryGradientStart: string;
  secondaryText: string;
  accentText: string;
  text?: string;
  card?: string;
}

interface EventCardProps {
  event: EventType;
  theme: EventTheme;
  onPress?: () => void;
  style?: any;
  animationDelay?: number;
  getEventStatus?: (event: EventType) => FilterType | EventStatus;
  isUserAttending?: (eventId: string) => boolean;
}

// Updated EventCard to match feed styling
const EventCard: React.FC<EventCardProps> = ({
  event,
  theme,
  onPress,
  style,
  animationDelay,
  getEventStatus,
  isUserAttending
}) => {
  // Determine if user is attending this event
  const isAttending = isUserAttending ? isUserAttending(event.id) : false;
  
  // Get event status if function is provided and convert to EventStatus if needed
  const getStatus = (): EventStatus | undefined => {
    if (!getEventStatus) return undefined;
    
    const result = getEventStatus(event);
    
    // If result is already an EventStatus object
    if (typeof result === 'object' && result !== null && 'label' in result) {
      return result as EventStatus;
    }
    
    // If result is a FilterType string, convert it to EventStatus
    if (typeof result === 'string') {
      const statusMap: Record<FilterType, EventStatus> = {
        'all': { label: 'All', color: '#6B7280' },
        'upcoming': { label: 'Upcoming', color: '#3B82F6' },
        'ongoing': { label: 'Live Now', color: '#10B981' },
        'completed': { label: 'Completed', color: '#6B7280' }
      };
      return statusMap[result as FilterType] || { label: result, color: theme.accentText };
    }
    
    return undefined;
  };
  
  const status = getStatus();
  // Format date for display
  const formatEventDate = (date?: string | Date): string => {
    if (!date) return 'TBD';
    const eventDate = new Date(date);
    return format(eventDate, 'EEE, MMM d • h:mm a');
  };

  // Generate category color
  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      music: '#3B82F6',
      sports: '#10B981',
      art: '#8B5CF6',
      food: '#F59E0B',
      technology: '#6366F1',
      community: '#EC4899',
      default: theme.primaryGradientStart
    };
    
    if (!category) return colors.default;
    const lowercaseCategory = category.toLowerCase();
    return colors[lowercaseCategory] || colors.default;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card || '#FFFFFF'
        },
        style
      ]}
      activeOpacity={0.9}
      onPress={onPress || (() => router.push({
        pathname: '/screens/eventdetails',
        params: { id: event.id.toString() }
      }))}
    >
      {/* Event Image with Gradient Overlay */}
      <View style={styles.imageContainer}>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: getCategoryColor(event.category) }]}>
            <FontAwesome name="calendar" size={36} color="#FFFFFF" />
          </View>
        )}
        
        {/* Status Badge */}
        {status && (
          <View style={[
            styles.statusBadge,
            { backgroundColor: status.color || theme.accentText }
          ]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        )}
        
        {/* Attendance Badge */}
        {isAttending && (
          <View style={styles.attendingBadge}>
            <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.attendingText}>Attending</Text>
          </View>
        )}
      </View>
      
      {/* Event Details */}
      <View style={styles.detailsContainer}>
        {/* Date and Time */}
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={16} color={theme.secondaryText} />
          <Text style={[styles.dateText, { color: theme.secondaryText }]}>
            {formatEventDate(event.date)}
          </Text>
        </View>
        
        {/* Event Title */}
        <Text style={[styles.title, { color: theme.text || '#1F2937' }]} numberOfLines={2}>
          {event.title}
        </Text>
        
        {/* Location */}
        {event.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={theme.secondaryText} />
            <Text style={[styles.locationText, { color: theme.secondaryText }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        
        {/* Category and Attendees */}
        <View style={styles.bottomRow}>
          {event.category && (
            <View style={[
              styles.categoryTag,
              { backgroundColor: getCategoryColor(event.category) + '20' } // Adding transparency
            ]}>
              <Text style={[
                styles.categoryText,
                { color: getCategoryColor(event.category) }
              ]}>
                {event.category}
              </Text>
            </View>
          )}
          
          {event.attendees !== undefined && (
            <View style={styles.attendeesContainer}>
              <MaterialIcons name="people" size={16} color={theme.secondaryText} />
              <Text style={[styles.attendeesText, { color: theme.secondaryText }]}>
                {Array.isArray(event.attendees) ? event.attendees.length : event.attendees}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF', // This could be theme.card if available
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    ...createShadow(2),
  },
  imageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 13,
    marginLeft: 4,
  },
});

export default EventCard;