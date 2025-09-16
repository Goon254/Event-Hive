//app/(tabs)/explore.tsx
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import eventService, { Event as EventType, PaginatedResponse } from '../services/eventServices';
import { createShadow } from '../utils/platformUtils';
import { auth } from '../../lib/firebaseConfig';
import ScreenWrapper from '../components/common/ScreenWrapper';
import DSButton from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import Divider from '../components/design-system/Divider';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types for filtering
type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'attending';

// Updated theme to match feed styling
const THEME = {
  // Base colors
  background: '#F9FAFB',
  card: '#FFFFFF',
  
  // Gradients
  primaryGradientStart: '#2563EB',
  primaryGradientEnd: '#4F46E5',
  
  // Text colors
  text: '#1F2937',
  secondaryText: '#6B7280',
  accentText: '#4F46E5',
  
  // UI elements
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Status colors
  upcoming: '#3B82F6',
  ongoing: '#10B981',
  completed: '#6B7280',
  attending: '#8B5CF6',
};

// Firestore timestamp type guard
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
};

function isFirestoreTimestamp(obj: any): obj is FirestoreTimestamp {
  return obj && typeof obj.toDate === 'function' && 'seconds' in obj;
}

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animations with safe area insets
  const headerHeight = Platform.OS === 'ios' ? 130 + insets.top : 110;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // Fetch events from service
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await eventService.getEvents();
      
      // Log the response structure to help with debugging
      console.log('Events data structure:', JSON.stringify(eventsData).substring(0, 200) + '...');
      
      // Handle the PaginatedResponse structure from eventService
      if (eventsData) {
        if ('items' in eventsData && Array.isArray(eventsData.items)) {
          console.log(`Fetched ${eventsData.items.length} events from 'items' property`);
          setEvents(eventsData.items);
        } else if ('events' in eventsData && Array.isArray(eventsData.events)) {
          console.log(`Fetched ${eventsData.events.length} events from 'events' property`);
          setEvents(eventsData.events);
        } else if ('data' in eventsData && Array.isArray(eventsData.data)) {
          console.log(`Fetched ${eventsData.data.length} events from 'data' property`);
          setEvents(eventsData.data);
        } else if (Array.isArray(eventsData)) {
          console.log(`Fetched ${eventsData.length} events from array response`);
          setEvents(eventsData);
        } else {
          console.warn('Unexpected events data structure:', eventsData);
          setEvents([]);
        }
      } else {
        console.warn('No events data returned from API');
        setEvents([]);
      }
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
          if (attending &&
              typeof attending === 'object') {
            // Handle different possible response structures
            const eventsArray = 'items' in attending && Array.isArray(attending.items)
              ? attending.items
              : 'events' in attending && Array.isArray(attending.events)
                ? attending.events
                : 'data' in attending && Array.isArray(attending.data)
                  ? attending.data
                  : [];
                
            if (eventsArray.length > 0) {
              // Extract event IDs from the events array
              setAttendingEvents(eventsArray.map((event: EventType) => event.id));
            } else {
              console.log('Events array is empty');
            }
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
  const getEventStatus = (event: EventType): 'upcoming' | 'ongoing' | 'completed' | 'unknown' => {
    // Safety check for invalid event objects
    if (!event || !event.date) {
      return 'unknown';
    }
    
    const now = new Date();
    let eventDate: Date;
    let eventTime: Date;

    try {
      // Handle event date with type guards
      if (event.date instanceof Date) {
        eventDate = event.date;
      } else if (isFirestoreTimestamp(event.date)) {
        eventDate = event.date.toDate();
      } else if (typeof event.date === 'string') {
        eventDate = new Date(event.date);
      } else {
        console.warn('Unsupported date format:', event.date);
        return 'unknown';
      }

      // Handle event time with type guards
      if (event.time instanceof Date) {
        eventTime = event.time;
      } else if (isFirestoreTimestamp(event.time)) {
        eventTime = event.time.toDate();
      } else if (typeof event.time === 'string') {
        eventTime = new Date(event.time);
      } else {
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

  // Get color for event status
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'upcoming':
        return THEME.upcoming;
      case 'ongoing':
        return THEME.ongoing;
      case 'completed':
        return THEME.completed;
      default:
        return THEME.secondaryText;
    }
  };

  // Filter events based on selected filter and search query
  useEffect(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    console.log(`Filtering ${events.length} events with filter: ${selectedFilter}, search: "${searchQuery}"`);
    
    let result = [...events];
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'attending') {
        // Filter events the user is attending
        result = result.filter(event => attendingEvents.includes(event.id));
        console.log(`After attending filter: ${result.length} events`);
      } else {
        // Filter by status
        result = result.filter(event => getEventStatus(event) === selectedFilter);
        console.log(`After ${selectedFilter} filter: ${result.length} events`);
      }
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        (event.title && event.title.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query)) ||
        (event.locationDetails?.city?.toLowerCase().includes(query))
      );
      console.log(`After search filter: ${result.length} events`);
    }
    
    setFilteredEvents(result);
  }, [selectedFilter, searchQuery, events, attendingEvents]);

  // Initial fetch
  useEffect(() => {
    console.log('Initiating event fetch, user ID:', user?.id);
    fetchEvents();
  }, [user?.id]);

  const formatDate = (date: Date | FirestoreTimestamp | string | null | undefined): string => {
    if (!date) return 'No date';
    
    try {
      let eventDate: Date;
      
      if (date instanceof Date) {
        eventDate = date;
      } else if (isFirestoreTimestamp(date)) {
        eventDate = date.toDate();
      } else if (typeof date === 'object' && 'seconds' in date) {
        eventDate = new Date((date as FirestoreTimestamp).seconds * 1000);
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

  const formatTime = (time: Date | FirestoreTimestamp | string | null | undefined): string => {
    if (!time) return '';
    
    try {
      let eventTime: Date;
      
      if (time instanceof Date) {
        eventTime = time;
      } else if (isFirestoreTimestamp(time)) {
        eventTime = time.toDate();
      } else if (typeof time === 'object' && 'seconds' in time) {
        eventTime = new Date((time as FirestoreTimestamp).seconds * 1000);
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

  interface EventCardProps {
    item: EventType;
    index: number;
  }
  
  const EventCard = React.memo(({ item, index }: EventCardProps) => {
    // Validate the event item has required properties
    if (!item || !item.id) {
      console.warn('Invalid event item:', item);
      return null;
    }
    
    const status = getEventStatus(item);
    const isAttending = item.id && attendingEvents.includes(item.id);
    
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
    }, [index, itemFadeAnim, itemTranslateY]);
    
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
              <View style={[styles.eventImagePlaceholder, { backgroundColor: getColorForEvent(item.title || 'E') }]}>
                <Text style={styles.eventImageText}>{(item.title || 'E').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            
            {/* Status badge */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status) + '20' } // 20% opacity
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(status) }
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
            <Text style={styles.eventTitle} numberOfLines={1}>{item.title || 'Untitled Event'}</Text>
            
            <View style={styles.eventInfo}>
              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={16} color={THEME.secondaryText} />
                <Text style={styles.eventDetails}>
                  {formatDate(item.date)} {item.time ? `• ${formatTime(item.time)}` : ''}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={THEME.secondaryText} />
                <Text style={styles.eventDetails} numberOfLines={1}>
                  {item.location || 'Location TBD'}
                </Text>
              </View>
              
              {item.isPaid && (
                <View style={styles.infoRow}>
                  <FontAwesome name="ticket" size={16} color={THEME.secondaryText} />
                  <Text style={styles.eventDetails}>
                    ${(item.price ?? 0).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Added attendee count indicator */}
            {item.attendees && item.attendees.length > 0 && (
              <View style={styles.attendeeCount}>
                <Ionicons name="people-outline" size={14} color={THEME.secondaryText} />
                <Text style={styles.attendeeCountText}>{item.attendees.length} attending</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const renderEventCard = ({ item, index }: { item: EventType; index: number }): React.ReactElement | null => {
    if (!item) {
      console.warn('Attempted to render null or undefined event item');
      return null;
    }
    return <EventCard item={item} index={index} />;
  };
  
  // Function to generate consistent colors based on text
  const getColorForEvent = (text: string): string => {
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
        <ActivityIndicator size="large" color={THEME.primaryGradientStart} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  // Create header right content
  const headerRightContent = (
    <View style={styles.headerButtons}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.push('/screens/map')}
      >
        <MaterialIcons name="map" size={22} color="#FFF" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.push('/screens/notifications')}
      >
        <Ionicons name="notifications" size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper
      backgroundColor={THEME.background}
      statusBarStyle="light-content"
      header={{
        title: "Explore Events",
        rightContent: headerRightContent,
        gradientColors: [THEME.primaryGradientStart, THEME.primaryGradientEnd]
      }}
      contentContainerStyle={{ paddingTop: 0 }}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }],
              marginTop: 20
            }
          ]}
        >
          <Ionicons name="search" size={18} color={THEME.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events by title or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={THEME.secondaryText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={THEME.secondaryText} />
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
                  selectedFilter === filter && { backgroundColor: getStatusColor(filter as string) + '20' }
                ]}
                onPress={() => setSelectedFilter(filter as FilterType)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive,
                    selectedFilter === filter && { color: getStatusColor(filter as string) }
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Create an animated version of FlatList to support native scroll events */}
        {/* This fixes the "Components based on VirtualizedList must be wrapped with Animated.createAnimatedComponent" error */}
        <Animated.FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={item => item.id || Math.random().toString()}
          contentContainerStyle={styles.eventList}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[THEME.primaryGradientStart]}
              tintColor={THEME.accentText}
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
              
              {selectedFilter === 'all' && searchQuery.length === 0 && (
                <DSButton title="Refresh" onPress={handleRefresh} />
              )}
            </Animated.View>
          }
        />
        
        {user && (
          <TouchableOpacity
            style={[
              styles.createButton,
              { bottom: Platform.OS === 'ios' ? 32 : 24 }
            ]}
            onPress={() => router.push('/screens/create')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[THEME.primaryGradientStart, THEME.primaryGradientEnd]}
              style={styles.createButtonGradient}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(2);
const searchShadow = createShadow(1);
const buttonShadow = createShadow(3);

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.text,
    marginTop: 16,
  },
  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...searchShadow,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    marginRight: 8,
  },
  // Filter buttons
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
    backgroundColor: THEME.divider,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: THEME.primaryGradientStart + '20', // 20% opacity
  },
  filterButtonText: {
    fontSize: 14,
    color: THEME.secondaryText,
  },
  filterButtonTextActive: {
    color: THEME.accentText,
    fontWeight: '600',
  },
  // Event list
  eventList: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80, // Extra space for FAB
  },
  // Event card
  eventCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  eventImageContainer: {
    position: 'relative',
    height: 160,
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
    backgroundColor: THEME.divider,
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text,
  },
  attendingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: THEME.attending,
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: THEME.text,
  },
  eventInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: THEME.secondaryText,
  },
  attendeeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: THEME.divider,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  attendeeCountText: {
    fontSize: 12,
    color: THEME.secondaryText,
    marginLeft: 4,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
    backgroundColor: THEME.card,
    borderRadius: 16,
    ...createShadow(1),
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: THEME.secondaryText,
    marginTop: 8,
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: THEME.primaryGradientStart,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Create button (FAB)
  createButton: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 32 : 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...buttonShadow,
  },
  createButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});