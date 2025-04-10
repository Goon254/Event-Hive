//app/(tabs)/Explore.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import eventService, { Event as EventType } from '../services/eventServices';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../lib/firebaseConfig';

// Types for filtering
type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'attending';

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendingEvents, setAttendingEvents] = useState<string[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Fetch events from service
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await eventService.getEvents();
      
      // Set events from the events array in the response
      setEvents(eventsData.events);
      
      // If user is logged in, fetch events they're attending
      if (user) {
        try {
          // Check if the current user is authenticated
          if (!auth.currentUser) {
            console.log('No authenticated user found, skipping attending events fetch');
            return;
          }
          
          // Check if the current user ID matches the requested user ID
          if (auth.currentUser.uid !== user.id) {
            console.log('User ID mismatch - cannot access other users attending events');
            return;
          }
          
          const attending = await eventService.getUserAttendingEvents(user.id);
          
          // Check if we got any events back
          if (attending && attending.events && attending.events.length > 0) {
            // Extract event IDs from the events array
            setAttendingEvents(attending.events.map(event => event.id));
          } else {
            console.log('No attending events found or empty result returned');
          }
        } catch (attendingError) {
          // Just log the error but don't show an alert - this is not critical functionality
          console.error('Error fetching attending events:', attendingError);
          // Continue with the main events display
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      
      // Start animations when content loads
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
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  // Determine event status based on date and time
  const getEventStatus = (event: EventType) => {
    if (!event || !event.date) return 'unknown';
    
    const now = new Date();
    
    // Safely handle different date formats
    let eventDate: Date;
    let eventTime: Date;
    
    try {
      // Handle event date
      if (event.date instanceof Date) {
        eventDate = event.date;
      } else if (event.date.toDate && typeof event.date.toDate === 'function') {
        eventDate = event.date.toDate();
      } else if (typeof event.date === 'object' && 'seconds' in event.date) {
        eventDate = new Date((event.date as any).seconds * 1000);
      } else {
        eventDate = new Date(event.date as any);
      }
      
      // Handle event time
      if (event.time instanceof Date) {
        eventTime = event.time;
      } else if (event.time && event.time.toDate && typeof event.time.toDate === 'function') {
        eventTime = event.time.toDate();
      } else if (event.time && typeof event.time === 'object' && 'seconds' in event.time) {
        eventTime = new Date((event.time as any).seconds * 1000);
      } else if (event.time) {
        eventTime = new Date(event.time as any);
      } else {
        // Default to noon if time is not available
        eventTime = new Date(eventDate);
        eventTime.setHours(12, 0, 0, 0);
      }
      
      // Combine date and time
      const eventDateTime = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventTime.getHours(),
        eventTime.getMinutes()
      );
      
      // Add event duration (assuming 3 hours if not specified)
      const eventDuration = event.duration || 3 * 60 * 60 * 1000; // 3 hours in ms
      const eventEndTime = new Date(eventDateTime.getTime() + eventDuration);
      
      if (now < eventDateTime) {
        return 'upcoming';
      } else if (now >= eventDateTime && now <= eventEndTime) {
        return 'ongoing';
      } else {
        return 'completed';
      }
    } catch (error) {
      console.warn('Error determining event status:', error, event);
      return 'unknown';
    }
  };

  // Filter events based on selected filter and search query
  useEffect(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let result = [...events];
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'attending') {
        // Filter events the user is attending
        result = result.filter(event => attendingEvents.includes(event.id));
      } else {
        // Filter by status
        result = result.filter(event => getEventStatus(event) === selectedFilter);
      }
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        (event.location && event.location.toLowerCase().includes(query)) ||
        (event.locationDetails && event.locationDetails.city && 
         event.locationDetails.city.toLowerCase().includes(query))
      );
    }
    
    setFilteredEvents(result);
  }, [selectedFilter, searchQuery, events, attendingEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [user?.id]);

  const formatDate = (date: Date | any) => {
    if (!date) return 'No date';
    
    try {
      let eventDate: Date;
      
      if (date instanceof Date) {
        eventDate = date;
      } else if (date.toDate && typeof date.toDate === 'function') {
        eventDate = date.toDate();
      } else if (typeof date === 'object' && 'seconds' in date) {
        eventDate = new Date((date as any).seconds * 1000);
      } else {
        eventDate = new Date(date);
      }
      
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  const formatTime = (time: Date | any) => {
    if (!time) return '';
    
    try {
      let eventTime: Date;
      
      if (time instanceof Date) {
        eventTime = time;
      } else if (time.toDate && typeof time.toDate === 'function') {
        eventTime = time.toDate();
      } else if (typeof time === 'object' && 'seconds' in time) {
        eventTime = new Date((time as any).seconds * 1000);
      } else {
        eventTime = new Date(time);
      }
      
      return eventTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting time:', error, time);
      return '';
    }
  };

  const renderEventCard = ({ item, index }: { item: EventType; index: number }) => {
    const status = getEventStatus(item);
    const isAttending = attendingEvents.includes(item.id);
    
    // Calculate staggered animation delay based on index
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemTranslateY = useRef(new Animated.Value(20)).current;
    
    useEffect(() => {
      const delay = index * 100; // Stagger effect - 100ms delay per item
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
          {/* Event image or placeholder */}
          <View style={styles.eventImageContainer}>
            {item.imageUrl ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageGradient}
                />
              </View>
            ) : (
              <View style={[styles.eventImagePlaceholder, { backgroundColor: getColorForEvent(item.title) }]}>
                <Text style={styles.eventImageText}>{item.title.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            
            {/* Status badge */}
            <View style={[
              styles.statusBadge,
              status === 'upcoming' && styles.upcomingBadge,
              status === 'ongoing' && styles.ongoingBadge,
              status === 'completed' && styles.completedBadge,
            ]}>
              <Text style={[
                styles.statusText,
                status === 'upcoming' && styles.upcomingText,
                status === 'ongoing' && styles.ongoingText,
                status === 'completed' && styles.completedText,
              ]}>
                {status.toUpperCase()}
              </Text>
            </View>
            
            {/* Attending indicator */}
            {isAttending && (
              <View style={styles.attendingBadge}>
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
              </View>
            )}
          </View>
        
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
            
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
            
            {/* Added attendee count indicator */}
            {item.attendees && item.attendees.length > 0 && (
              <View style={styles.attendeeCount}>
                <FontAwesome name="users" size={12} color="#6B7280" />
                <Text style={styles.attendeeCountText}>{item.attendees.length} attending</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Function to generate consistent colors based on text
  const getColorForEvent = (text: string) => {
    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', 
      '#3B82F6', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'
    ];
    
    // Simple hash function for string
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a consistent index in our color array
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <Text style={styles.headerTitle}>Explore Events</Text>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <FontAwesome name="search" size={18} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events by title or location"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.View 
        style={[
          styles.filterContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'upcoming', 'ongoing', 'completed', ...(user ? ['attending'] : [])].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter as FilterType)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.eventList}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            colors={['#007AFF']} 
          />
        }
        ListEmptyComponent={
          <Animated.View 
            style={[
              styles.emptyContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateY }]
              }
            ]}
          >
            <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No events found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
            {selectedFilter !== 'all' && searchQuery.length === 0 && (
              <Text style={styles.emptySubtext}>Try changing your filter</Text>
            )}
          </Animated.View>
        }
      />
      
      {user && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/screens/Create')}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(3);
const searchShadow = createShadow(2);
const buttonShadow = createShadow(5);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB',
  },
  header: {
    ...safeTopPadding(16), // Use platform-specific safe top padding
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold', // More natural font weight per platform
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Platform.OS === 'ios' ? 10 : 8, // Slightly different radius per platform
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    ...searchShadow, // Platform-specific shadow
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginRight: 8,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingRight: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
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
  eventList: {
    padding: 16,
    paddingBottom: 80, // Extra space for FAB
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 12 : 8, // Platform-specific radius
    marginBottom: 16,
    ...cardShadow, // Platform-specific shadow
    overflow: 'hidden',
  },
  eventImageContainer: {
    position: 'relative',
    height: 120,
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
    fontSize: 36,
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
    // Add zIndex for iOS to ensure proper rendering of absolute positioned elements
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
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
  attendingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10B981',
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    // Add zIndex for iOS
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  eventInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  attendeeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
  },
  createButton: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 32 : 24, // Platform-specific positioning
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...buttonShadow, // Platform-specific shadow
    elevation: 6, // Increased elevation for better appearance on Android
  },
});