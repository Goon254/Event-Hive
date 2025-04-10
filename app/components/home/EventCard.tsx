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
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '../../services/eventServices';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatDate } from '../../utils/dateUtils';
import { getEventColor, createShadow } from './utils/uiHelpers';

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
  
  return (
    <Animated.View
      style={{
        opacity: fadeValue,
        transform: [{ translateY: translateValue }]
      }}
    >
      <TouchableOpacity
        style={[
          styles.eventCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}
        onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
        activeOpacity={0.7}
        // Add accessibility props
        accessible={true}
        accessibilityLabel={`${item.title} event on ${formatDate(item.date)}`}
        accessibilityRole="button"
        accessibilityHint="Opens event details"
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
          
          {/* Attending indicator */}
          {isAttending && (
            <View style={styles.attendingBadge}>
              <MaterialIcons name="check-circle" size={16} color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.eventContent}>
          <Text 
            style={[styles.eventTitle, { color: Colors[colorScheme ?? 'light'].text }]} 
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.eventMetaRow}>
            <FontAwesome name="calendar" size={14} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.eventMetaText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.eventMetaRow}>
            <FontAwesome name="map-marker" size={14} color={Colors[colorScheme ?? 'light'].tint} />
            <Text 
              style={[styles.eventMetaText, { color: Colors[colorScheme ?? 'light'].text }]} 
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
          {item.isPaid && (
            <View style={styles.eventMetaRow}>
              <FontAwesome name="ticket" size={14} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.eventMetaText, { color: Colors[colorScheme ?? 'light'].text }]}>
                ${item.price?.toFixed(2) || '0.00'}
              </Text>
            </View>
          )}
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
    ...cardShadow,
    marginRight: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
  eventContent: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventMetaText: {
    marginLeft: 8,
    fontSize: 14,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(EventCard);