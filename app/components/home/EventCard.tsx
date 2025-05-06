// components/home/EventCard.tsx (Premium Modern Tropical)

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Event as EventType } from '../../services/eventServices';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedElement } from 'react-navigation-shared-element';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin each side
const THUMB_SIZE = 68; // Slightly larger thumbnail

interface EventStatus {
  label: string;
  color?: string;
  backgroundColor?: string;
}

interface EventTheme {
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondaryText: string;
  accentText: string;
  text?: string;
  card?: string;
  cardGlassEffect?: boolean;
}

interface EventCardProps {
  event: EventType;
  theme: EventTheme;
  onPress?: () => void;
  getEventStatus?: (event: EventType) => EventStatus;
  isUserAttending?: (eventId: string) => boolean;
  style?: any;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  theme,
  onPress,
  getEventStatus,
  isUserAttending,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => Animated.spring(scaleAnim, { 
    toValue: 0.98,
    friction: 7,
    tension: 40,
    useNativeDriver: true 
  }).start();
  
  const handlePressOut = () => Animated.spring(scaleAnim, { 
    toValue: 1,
    friction: 5,
    tension: 40,
    useNativeDriver: true 
  }).start();

  const status = getEventStatus ? getEventStatus(event) : undefined;
  const isAttending = isUserAttending ? isUserAttending(event.id) : false;

  const formatEventDate = (date?: string | Date) => {
    if (!date) return 'TBD';
    return format(new Date(date), 'EEE, MMM d');
  };

  // Calculate days remaining until event
  const getDaysRemaining = (date?: string | Date) => {
    if (!date) return null;
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysRemaining = getDaysRemaining(event.date);

  const renderCardContent = () => (
    <View style={styles.rowContainer}>
      {/* Background image for consistent design aesthetic */}
      <Image
        source={require('../../../assets/images/tropical-gradient.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Thumbnail with shared element transition */}
      <SharedElement id={`event.${event.id}.image`}>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
            style={[styles.thumbnail, styles.thumbnailPlaceholder]}
          >
            <FontAwesome5 name="palm-tree" size={22} color="#FFF" />
          </LinearGradient>
        )}
      </SharedElement>

      {/* Text Info */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {event.title}
          </Text>
          
          {isAttending && (
            <View style={[styles.attendingBadge, { backgroundColor: '#17B99A20' }]}>
              <MaterialCommunityIcons name="check-circle" size={12} color="#17B99A" style={{ marginRight: 4 }} />
              <Text style={[styles.attendingText, { color: '#17B99A' }]}>Going</Text>
            </View>
          )}
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={theme.secondaryText} style={{ marginRight: 4 }} />
            <Text style={[styles.dateText, { color: theme.secondaryText }]}>
              {formatEventDate(event.date)}
            </Text>
          </View>

          {daysRemaining !== null && (
            <View style={[styles.daysRemainingTag, { backgroundColor: theme.primaryGradientStart + '20' }]}>
              <Text style={[styles.daysRemainingText, { color: theme.primaryGradientStart }]}>
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={theme.secondaryText} style={{ marginRight: 4 }} />
          <Text style={[styles.locationText, { color: theme.secondaryText }]} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        
        {/* Capacity indicator */}
        {event.capacity && event.attendees && (
          <View style={styles.capacityContainer}>
            <View style={styles.capacityBarBackground}>
              <View 
                style={[
                  styles.capacityBarFill, 
                  { 
                    width: `${Math.min(100, (event.attendees.length / event.capacity) * 100)}%`,
                    backgroundColor: theme.primaryGradientStart
                  }
                ]} 
              />
            </View>
            <Text style={[styles.capacityText, { color: theme.secondaryText }]}>
              {event.attendees.length}/{event.capacity} spots
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress || (() => router.push({ pathname: '/screens/eventdetails', params: { id: event.id.toString() } }))}
    >
      <Animated.View 
        style={[
          styles.card,
          { 
            backgroundColor: theme.cardGlassEffect ? 'rgba(255, 255, 255, 0.8)' : theme.card,
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
          theme.cardGlassEffect && Platform.OS === 'ios' && { 
            backdropFilter: 'blur(12px)',
          },
          style
        ]}
      >
        {/* Card status indicator (if any) */}
        {status && (
          <View 
            style={[
              styles.statusStrip, 
              { 
                backgroundColor: status.backgroundColor || theme.primaryGradientStart 
              }
            ]}
          />
        )}
        
        {renderCardContent()}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15,
    borderRadius: 20,
  },
  statusStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 18,
    marginRight: 16,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  daysRemainingTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  daysRemainingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '400',
  },
  attendingBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  capacityContainer: {
    marginTop: 4,
  },
  capacityBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '500',
  }
});

export default EventCard;