// app/(tabs)/feed.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import services and utilities
import eventService, { Event as EventType } from '../services/eventServices';
import { useAuth } from '../AuthContext';
import { createShadow } from '../utils/platformUtils';
import { formatDate, formatTime } from '../utils/dateUtils';

// Screen dimensions
const { width } = Dimensions.get('window');

// Types for feed filtering
type FeedFilterType = 'all' | 'following' | 'nearby' | 'suggested';

export default function EventFeedScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FeedFilterType>('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Fetch events 
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Different fetching logic based on filter
      let fetchedEvents: EventType[] = [];
      switch (selectedFilter) {
        case 'following':
          // TODO: Implement following events logic
          fetchedEvents = await eventService.getEvents();
          break;
        case 'nearby':
          // TODO: Implement nearby events logic
          fetchedEvents = await eventService.getEvents();
          break;
        case 'suggested':
          // TODO: Implement suggested events logic
          fetchedEvents = await eventService.getEvents();
          break;
        default:
          fetchedEvents = await eventService.getEvents();
      }

      // Sort events by date (newest first)
      const sortedEvents = fetchedEvents.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      });

      setEvents(sortedEvents);
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]).start();
      
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFilter]);

  // Initial and filter-change event fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Determine event status
  const getEventStatus = (event: EventType) => {
    if (!event || !event.date) return 'unknown';
    
    const now = new Date();
    const eventDate = event.date instanceof Date ? event.date : event.date.toDate();
    const eventTime = event.time instanceof Date ? event.time : event.time.toDate();
    
    const eventDateTime = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      eventTime.getHours(),
      eventTime.getMinutes()
    );
    
    const eventDuration = event.duration || 3 * 60 * 60 * 1000; // 3 hours
    const eventEndTime = new Date(eventDateTime.getTime() + eventDuration);
    
    if (now < eventDateTime) return 'upcoming';
    if (now >= eventDateTime && now <= eventEndTime) return 'ongoing';
    return 'completed';
  };

  // Generate consistent colors based on event title
  const getEventColor = (text: string) => {
    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', 
      '#3B82F6', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'
    ];
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Render individual event card
  const renderEventCard = ({ item, index }: { item: EventType; index: number }) => {
    const status = getEventStatus(item);
    
    // Staggered animation for each card
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemTranslateY = useRef(new Animated.Value(20)).current;
    
    useEffect(() => {
      const delay = index * 100; // Stagger effect
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(itemTranslateY, {
          toValue: 0,
          duration: 400,
          delay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]).start();
    }, []);
    
    return (
      <Animated.View
        style={{
          opacity: itemFadeAnim,
          transform: [{ translateY: itemTranslateY }]
        }}
      >
        <TouchableOpacity
          style={styles.eventCard}
          onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
          activeOpacity={0.7}
        >
          {/* Event Image or Placeholder */}
          <View style={styles.eventImageContainer}>
            {item.imageUrl ? (
              <View style={styles.imageWrapper}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.eventImage} 
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageGradient}
                />
              </View>
            ) : (
              <View 
                style={[
                  styles.eventImagePlaceholder, 
                  { backgroundColor: getEventColor(item.title) }
                ]}
              >
                <Text style={styles.eventImageText}>
                  {item.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            {/* Event Status Badge */}
            <View style={[
              styles.statusBadge,
              status === 'upcoming' && styles.upcomingBadge,
              status === 'ongoing' && styles.ongoingBadge,
              status === 'completed' && styles.completedBadge
            ]}>
              <Text style={[
                styles.statusText,
                status === 'upcoming' && styles.upcomingText,
                status === 'ongoing' && styles.ongoingText,
                status === 'completed' && styles.completedText
              ]}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Event Details */}
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            
            <View style={styles.eventInfo}>
              <View style={styles.infoRow}>
                <FontAwesome name="calendar" size={14} color="#6B7280" />
                <Text style={styles.eventDetails}>
                  {formatDate(item.date)} • {formatTime(item.time)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <FontAwesome name="map-marker" size={14} color="#6B7280" />
                <Text style={styles.eventDetails} numberOfLines={1}>
                  {item.location || 'Location TBD'}
                </Text>
              </View>
              
              {item.isPaid && (
                <View style={styles.infoRow}>
                  <FontAwesome name="ticket" size={14} color="#6B7280" />
                  <Text style={styles.eventDetails}>
                    ${item.price?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Attendee Count */}
            {item.attendees && item.attendees.length > 0 && (
              <View style={styles.attendeeCount}>
                <FontAwesome name="users" size={12} color="#6B7280" />
                <Text style={styles.attendeeCountText}>
                  {item.attendees.length} attending
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <Text style={styles.headerTitle}>Event Feed</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // TODO: Implement advanced filtering
            Alert.alert('Advanced Filters', 'Coming soon!');
          }}
        >
          <MaterialIcons name="filter-list" size={24} color="#1F2937" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Feed Filters */}
      <Animated.View 
        style={[
          styles.filterContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        {['all', 'following', 'nearby', 'suggested'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter as FeedFilterType)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
      
      {/* Events List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.eventList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchEvents();
              }}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No Events Found</Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter === 'all' 
                  ? "There are currently no events available." 
                  : `No events in the ${selectedFilter} category.`}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Create Event Button */}
      {user && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/Create')}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(3);
const searchShadow = createShadow(2);
const buttonShadow = createShadow(5);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...searchShadow,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  eventList: {
    padding: 16,
    paddingBottom: 80, // Space for create button
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  eventImageContainer: {
    position: 'relative',
    height: 200,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  upcomingBadge: {
    backgroundColor: '#EFF6FF',
  },
  ongoingBadge: {
    backgroundColor: '#ECFDF5',
  },
  completedBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  upcomingText: {
    color: '#1D4ED8',
  },
  ongoingText: {
    color: '#047857',
  },
  completedText: {
    color: '#B91C1C',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  eventInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  attendeeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  attendeeCountText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...buttonShadow,
  }
});