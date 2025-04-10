import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import eventService, { Event } from '../../../services/eventServices';
import { auth } from '../../../../lib/firebaseConfig';

// Filter types for events
export type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed';

/**
 * Custom hook for managing event data in the Home screen
 * Extracts data fetching and processing logic from the component
 */
// Cache keys
const CACHE_KEYS = {
  ALL_EVENTS: 'cached_all_events',
  USER_EVENTS: (userId: string) => `cached_user_events_${userId}`,
  ATTENDING_EVENTS: (userId: string) => `cached_attending_events_${userId}`,
  CACHE_TIMESTAMP: 'events_cache_timestamp',
};

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

export const useEventData = (userId?: string) => {
  // Event data state
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [attendingEvents, setAttendingEvents] = useState<string[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  
  // Refs for cancellation
  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  // Setup network listener on mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });
    
    // Set up cleanup for component unmount
    return () => {
      isMounted.current = false;
      unsubscribe();
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);
  
  // Cache management functions
  const saveToCache = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (e) {
      console.warn('Error saving to cache:', e);
    }
  };
  
  const loadFromCache = async (key: string) => {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (!cachedData) return null;
      
      // Check cache expiration
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      if (timestamp && Date.now() - parseInt(timestamp) > CACHE_EXPIRATION) {
        // Cache expired
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (e) {
      console.warn('Error loading from cache:', e);
      return null;
    }
  };
  
  // Load events data with improved error handling, caching, and network awareness
  const loadEvents = useCallback(async (forceRefresh = false) => {
    // Reset error state
    setError(null);
    
    // Create new abort controller for this request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    
    try {
      setLoading(true);
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        setIsOffline(true);
        
        // Try to load from cache if offline
        const cachedEvents = await loadFromCache(CACHE_KEYS.ALL_EVENTS);
        if (cachedEvents) {
          setEvents(cachedEvents);
          processEvents(cachedEvents);
          console.log('Loaded events from cache while offline');
        } else {
          throw new Error('No internet connection and no cached data available');
        }
        return;
      }
      
      // If we're online but not forcing refresh, try cache first
      if (!forceRefresh) {
        const cachedEvents = await loadFromCache(CACHE_KEYS.ALL_EVENTS);
        if (cachedEvents) {
          setEvents(cachedEvents);
          processEvents(cachedEvents);
          setLoading(false);
          
          // Load fresh data in the background
          fetchFreshData();
          return;
        }
      }
      
      // Fetch fresh data
      await fetchFreshData();
      
    } catch (error) {
      console.error('Error loading events:', error);
      setError(error instanceof Error ? error : new Error('Failed to load events'));
      
      // Try to load from cache as fallback
      const cachedEvents = await loadFromCache(CACHE_KEYS.ALL_EVENTS);
      if (cachedEvents) {
        setEvents(cachedEvents);
        processEvents(cachedEvents);
        console.log('Loaded events from cache after error');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [userId]);
  
  // Helper function to process events data
  const processEvents = useCallback((sortedEvents: Event[]) => {
    // Filter for upcoming events (events in the future)
    const now = new Date();
    const upcoming = sortedEvents.filter(event => {
      if (!event.date) return false;
      
      // Safely handle different date formats
      let eventDate: Date;
      try {
        if (event.date instanceof Date) {
          eventDate = event.date;
        } else if (event.date.toDate && typeof event.date.toDate === 'function') {
          // Firebase Timestamp
          eventDate = event.date.toDate();
        } else if (typeof event.date === 'object' && 'seconds' in event.date) {
          // Firebase Timestamp-like object
          eventDate = new Date((event.date as any).seconds * 1000);
        } else {
          // Try to parse as string or number
          eventDate = new Date(event.date as any);
        }
        
        return eventDate > now;
      } catch (error) {
        console.warn('Error processing event date:', error, event);
        return false;
      }
    });
    setUpcomingEvents(upcoming);
    
    // Set featured event (closest upcoming event)
    if (upcoming.length > 0) {
      setFeaturedEvent(upcoming[0]);
    }
    
    // Simulate nearby events by taking a random subset
    const shuffled = [...sortedEvents].sort(() => 0.5 - Math.random());
    setNearbyEvents(shuffled.slice(0, 5));
    
    // Filter for user's events if user is logged in
    if (userId) {
      const userEvents = sortedEvents.filter(event => event.createdBy === userId);
      setMyEvents(userEvents);
    }
    
    // Set filtered events initially to all events
    setFilteredEvents(sortedEvents);
  }, [userId]);
  
  // Function to fetch fresh data from Firestore
  const fetchFreshData = async () => {
    if (!isMounted.current) return;
    
    try {
      const eventsData = await eventService.getEvents();
      
      // Sort events by date (newest first)
      const sortedEvents = eventsData.events.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        
        // Safely handle different date formats
        let dateA: Date, dateB: Date;
        
        try {
          // Handle date A
          if (a.date instanceof Date) {
            dateA = a.date;
          } else if (a.date.toDate && typeof a.date.toDate === 'function') {
            dateA = a.date.toDate();
          } else if (typeof a.date === 'object' && 'seconds' in a.date) {
            dateA = new Date((a.date as any).seconds * 1000);
          } else {
            dateA = new Date(a.date as any);
          }
          
          // Handle date B
          if (b.date instanceof Date) {
            dateB = b.date;
          } else if (b.date.toDate && typeof b.date.toDate === 'function') {
            dateB = b.date.toDate();
          } else if (typeof b.date === 'object' && 'seconds' in b.date) {
            dateB = new Date((b.date as any).seconds * 1000);
          } else {
            dateB = new Date(b.date as any);
          }
          
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.warn('Error comparing event dates:', error, a, b);
          return 0;
        }
        return dateB.getTime() - dateA.getTime();
      });
      
      // Save to cache
      await saveToCache(CACHE_KEYS.ALL_EVENTS, sortedEvents);
      
      if (!isMounted.current) return;
      
      setEvents(sortedEvents);
      processEvents(sortedEvents);
      
      // Fetch user-specific data if user is logged in
      if (userId) {
        try {
          // Check if there's an authenticated user before fetching attending events
          if (!auth.currentUser) {
            console.log('No authenticated user found, skipping attending events fetch');
            
            // Try to load from cache
            const cachedAttending = await loadFromCache(CACHE_KEYS.ATTENDING_EVENTS(userId));
            if (cachedAttending && isMounted.current) {
              setAttendingEvents(cachedAttending);
            }
            return;
          }
          
          // Check if the current user ID matches the requested user ID
          if (auth.currentUser.uid !== userId) {
            console.log('User ID mismatch - cannot access other users attending events');
            
            // Try to load from cache
            const cachedAttending = await loadFromCache(CACHE_KEYS.ATTENDING_EVENTS(userId));
            if (cachedAttending && isMounted.current) {
              setAttendingEvents(cachedAttending);
            }
            return;
          }
          
          try {
            const attending = await eventService.getUserAttendingEvents(userId);
            
            // Check if we got any events back
            if (attending && attending.events && attending.events.length > 0) {
              if (isMounted.current) {
                const eventIds = attending.events.map(event => event.id);
                setAttendingEvents(eventIds);
                await saveToCache(CACHE_KEYS.ATTENDING_EVENTS(userId), eventIds);
              }
            } else {
              console.log('No attending events found or empty result returned');
              
              // Try to load from cache as fallback
              const cachedAttending = await loadFromCache(CACHE_KEYS.ATTENDING_EVENTS(userId));
              if (cachedAttending && isMounted.current) {
                setAttendingEvents(cachedAttending);
              }
            }
          } catch (attendingError) {
            console.error('Error fetching attending events:', attendingError);
            // Continue with the app even if attending events can't be fetched
            // Try to load from cache as fallback
            const cachedAttending = await loadFromCache(CACHE_KEYS.ATTENDING_EVENTS(userId));
            if (cachedAttending && isMounted.current) {
              setAttendingEvents(cachedAttending);
            }
          }
        } catch (userError) {
          console.error('Error loading user attending events:', userError);
          
          // Try to load from cache
          const cachedAttending = await loadFromCache(CACHE_KEYS.ATTENDING_EVENTS(userId));
          if (cachedAttending && isMounted.current) {
            setAttendingEvents(cachedAttending);
          }
        }
      }
      
      // Reset offline and error states since we successfully loaded data
      setIsOffline(false);
      setError(null);
      
    } catch (error) {
      if (!isMounted.current) return;
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Refresh events - force refresh from network
  const refreshEvents = useCallback(() => {
    setRefreshing(true);
    loadEvents(true); // Force refresh
  }, [loadEvents]);
  
  // Retry loading after error
  const retryLoading = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    loadEvents(true); // Force refresh on retry
  }, [loadEvents]);

  // Load events on mount, when userId changes, or on retry
  useEffect(() => {
    loadEvents();
  }, [loadEvents, retryCount]);

  // Filter events based on selected filters
  useEffect(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let result = [...events];
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      result = result.filter(event => getEventStatus(event) === selectedFilter);
    }
    
    // Apply category filter
    if (selectedCategory) {
      // In a real app, you'd have a category field in your events
      // For demo, we'll filter based on the title containing the category name
      const categoryName = selectedCategory.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(categoryName) ||
        (event.description && event.description.toLowerCase().includes(categoryName))
      );
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
  }, [selectedFilter, selectedCategory, searchQuery, events]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedFilter('all');
    setSelectedCategory(null);
    setSearchQuery('');
  }, []);

  // Get event status - memoized to avoid recalculating for the same event
  const getEventStatus = useCallback((event: Event): FilterType => {
    if (!event || !event.date) return 'all';
    
    const now = new Date();
    const eventDate = event.date instanceof Date ? event.date : (event.date.toDate ? event.date.toDate() : now);
    const eventTime = event.time instanceof Date ? event.time : (event.time?.toDate ? event.time.toDate() : now);
    
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
  }, []);

  // Get days until event
  const getDaysUntil = useCallback((date: Date | any) => {
    if (!date) return '';
    const eventDate = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date());
    const now = new Date();
    const diffTime = Math.abs(eventDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  }, []);

  return {
    // Event data
    events,
    upcomingEvents,
    nearbyEvents,
    myEvents,
    featuredEvent,
    filteredEvents,
    attendingEvents,
    
    // UI state
    loading,
    refreshing,
    error,
    isOffline,
    
    // Filter state
    searchQuery,
    selectedFilter,
    selectedCategory,
    
    // Actions
    setSearchQuery,
    setSelectedFilter,
    setSelectedCategory,
    loadEvents,
    refreshEvents,
    resetFilters,
    retryLoading,
    
    // Utilities
    getEventStatus,
    getDaysUntil,
    isUserAttending: useCallback((eventId: string) => attendingEvents.includes(eventId), [attendingEvents])
  };
};