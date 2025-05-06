// app/screens/event-history.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow } from '../utils/platformUtils';
import { formatDate, formatTime, getRelativeDays, toDateObject, formatDateWithTimezone } from '../utils/dateUtils';
import eventService, { Event as BaseEvent, PaginatedResponse } from '../services/eventServices';
import ScreenWrapper from '../components/common/ScreenWrapper';
import { COLORS } from '../theme/constants';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Explicitly disable the default header
export const screenOptions = {
  headerShown: false
};

// Extend the Event type to include the 'source' property
interface Event extends BaseEvent {
  source: 'attended' | 'created';
}

// Type for the grouped events by month
interface EventsByMonth {
  monthYear: string;
  month: number;
  year: number;
  events: Event[];
}

// Cache keys
const CACHE_KEYS = {
  ATTENDING_EVENTS: (userId: string) => `event_history_attending_${userId}`,
  CREATED_EVENTS: (userId: string) => `event_history_created_${userId}`,
  CACHE_TIMESTAMP: 'event_history_cache_timestamp',
};

// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

export default function EventHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<EventsByMonth[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'attended' | 'created'>('attended');

  // Cache management functions
  const saveToCache = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (e) {
      // Silent fail for cache operations
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
      // Silent fail for cache operations
      return null;
    }
  };

  useEffect(() => {
    fetchEventHistory();
  }, [user?.id]);

  useEffect(() => {
    // Group events by month whenever events or filter changes
    if (events.length > 0) {
      groupEventsByMonth();
    }
  }, [events, selectedFilter]);

  const processEvents = useCallback((attendedResponse: PaginatedResponse<BaseEvent>, createdResponse: PaginatedResponse<BaseEvent>) => {
    // Mark the source of each event (attended or created)
    const markedAttended = attendedResponse.items.map(event => ({ ...event, source: 'attended' as const }));
    const markedCreated = createdResponse.items.map(event => ({ ...event, source: 'created' as const }));
    
    // Combine and sort by date (newest first)
    const allEvents = [...markedAttended, ...markedCreated].sort((a, b) => {
      // Safely handle different date formats
      let dateA: Date, dateB: Date;
      
      try {
        // Handle date A
        if (a.date instanceof Date) {
          dateA = a.date;
        } else if (a.date && typeof a.date.toDate === 'function') {
          dateA = a.date.toDate();
        } else if (a.date && typeof a.date === 'object' && 'seconds' in a.date) {
          dateA = new Date((a.date as any).seconds * 1000);
        } else {
          dateA = new Date(a.date as any);
        }
        
        // Handle date B
        if (b.date instanceof Date) {
          dateB = b.date;
        } else if (b.date && typeof b.date.toDate === 'function') {
          dateB = b.date.toDate();
        } else if (b.date && typeof b.date === 'object' && 'seconds' in b.date) {
          dateB = new Date((b.date as any).seconds * 1000);
        } else {
          dateB = new Date(b.date as any);
        }
        
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });
    
    // Remove duplicates (might be both attended and created)
    const uniqueEvents = allEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );
    
    return uniqueEvents;
  }, []);

  const fetchEventHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Try to load from cache first
      const cachedAttending = await loadFromCache(CACHE_KEYS.ATTENDING_EVENTS(user.id));
      const cachedCreated = await loadFromCache(CACHE_KEYS.CREATED_EVENTS(user.id));
      
      if (cachedAttending && cachedCreated) {
        const processedEvents = processEvents(
          { items: cachedAttending, lastVisible: null, hasMore: false, totalFetched: cachedAttending.length },
          { items: cachedCreated, lastVisible: null, hasMore: false, totalFetched: cachedCreated.length }
        );
        setEvents(processedEvents);
        setIsLoading(false);
      }
      
      // Fetch fresh data
      const [attendedEvents, createdEvents] = await Promise.all([
        eventService.getUserAttendingEvents(user.id),
        eventService.getUserEvents(user.id)
      ]);
      
      // Save to cache
      await saveToCache(CACHE_KEYS.ATTENDING_EVENTS(user.id), attendedEvents.items);
      await saveToCache(CACHE_KEYS.CREATED_EVENTS(user.id), createdEvents.items);
      
      // Process and set events
      const processedEvents = processEvents(attendedEvents, createdEvents);
      setEvents(processedEvents);
    } catch (error) {
      // If fetch fails but we have cached data, keep using it
      if (events.length === 0) {
        Alert.alert('Error', 'Failed to load event history');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const groupEventsByMonth = () => {
    // Filter events based on selected filter
    const filteredEvents = events.filter(event => {
      if (selectedFilter === 'attended') return event.source === 'attended';
      if (selectedFilter === 'created') return event.source === 'created';
      return false;
    });
    
    // Group events by month and year
    const grouped: { [key: string]: EventsByMonth } = {};
    
    filteredEvents.forEach(event => {
      try {
        // Safely handle different date formats
        let eventDate: Date;
        
        if (event.date instanceof Date) {
          eventDate = event.date;
        } else if (event.date && typeof event.date.toDate === 'function') {
          eventDate = event.date.toDate();
        } else if (event.date && typeof event.date === 'object' && 'seconds' in event.date) {
          eventDate = new Date((event.date as any).seconds * 1000);
        } else {
          eventDate = new Date(event.date as any);
        }
        
        if (isNaN(eventDate.getTime())) {
          // Skip invalid dates
          return;
        }
        
        const month = eventDate.getMonth();
        const year = eventDate.getFullYear();
        const monthYear = `${getMonthName(month)} ${year}`;
        
        if (!grouped[monthYear]) {
          grouped[monthYear] = {
            monthYear,
            month,
            year,
            events: [],
          };
        }
        
        grouped[monthYear].events.push(event);
      } catch (error) {
        // Skip events with invalid dates
      }
    });
    
    // Convert to array and sort by date (newest first)
    const result = Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    setGroupedEvents(result);
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEventHistory();
  };

  // Generate background color based on event name for consistent colors
  const getEventColor = (title: string) => {
    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', 
      '#3B82F6', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'
    ];
    
    // Simple hash for string to number
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash) + title.charCodeAt(i);
      hash |= 0;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const renderEventItem = ({ item, index }: { item: Event, index: number }) => {
    const eventColor = getEventColor(item.title);
    const delay = index * 50; // stagger animation
    
    return (
      <Animatable.View 
        animation="fadeInUp" 
        duration={400}
        delay={delay}
        useNativeDriver
      >
        <TouchableOpacity
          style={styles.eventCardContainer}
          onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
          activeOpacity={0.9}
        >
          <BlurView intensity={20} tint="dark" style={styles.eventCard}>
            <View style={styles.eventCardHeader}>
              <View style={[styles.eventImageContainer, { backgroundColor: eventColor }]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
                ) : (
                  <Text style={styles.eventImagePlaceholder}>
                    {item.title.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.eventDateContainer}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.secondaryText} />
                  <Text style={styles.eventDate}>
                    {formatEventDate(item.date)}
                  </Text>
                </View>
                <View style={styles.eventLocationContainer}>
                  <Ionicons name="location-outline" size={14} color={COLORS.secondaryText} />
                  <Text style={styles.eventLocation} numberOfLines={1}>
                    {item.location || 'No location provided'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.eventStatusContainer}>
                {/* Only show role badge (attended or organized) */}
                <View style={[
                  styles.roleBadge, 
                  {
                    backgroundColor: item.source === 'created' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    borderColor: item.source === 'created' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                  }
                ]}>
                  <Text style={[
                    styles.roleText, 
                    {
                      color: item.source === 'created' ? '#F59E0B' : '#60A5FA'
                    }
                  ]}>
                    {item.source === 'created' ? 'Organized' : 'Attended'}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderMonthSection = ({ item, index }: { item: EventsByMonth, index: number }) => {
    return (
      <Animatable.View 
        animation="fadeIn" 
        duration={500}
        delay={index * 100}
        useNativeDriver
        style={styles.monthSection}
      >
        <Text style={styles.monthTitle}>{item.monthYear}</Text>
        {item.events.map((event, eventIndex) => (
          <View key={event.id}>
            {renderEventItem({ item: event, index: eventIndex })}
          </View>
        ))}
      </Animatable.View>
    );
  };

  return (
    <>
      {/* Make sure to hide the stack header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScreenWrapper
        backgroundColor={COLORS.background}
        statusBarStyle="light-content"
        backgroundImage={require('../../assets/images/tropical-gradient.png')}
        backgroundOpacity={0.15}
      >
        <View style={styles.container}>
          {/* Filter Tabs - Only Attended and Created */}
          <Animatable.View 
            animation="fadeInDown" 
            duration={500}
            style={styles.filterContainer}
          >
            <BlurView intensity={35} tint="dark" style={styles.filterTabsContainer}>
              <TouchableOpacity
                style={[styles.filterTab, selectedFilter === 'attended' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('attended')}
                activeOpacity={0.8}
              >
                {selectedFilter === 'attended' && (
                  <LinearGradient
                    colors={['rgba(126, 87, 194, 0.3)', 'rgba(126, 87, 194, 0.15)']}
                    style={styles.filterTabGradient}
                  />
                )}
                <Text style={[
                  styles.filterText,
                  selectedFilter === 'attended' && styles.filterTextActive
                ]}>
                  Attending
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterTab, selectedFilter === 'created' && styles.filterTabActive]}
                onPress={() => setSelectedFilter('created')}
                activeOpacity={0.8}
              >
                {selectedFilter === 'created' && (
                  <LinearGradient
                    colors={['rgba(126, 87, 194, 0.3)', 'rgba(126, 87, 194, 0.15)']}
                    style={styles.filterTabGradient}
                  />
                )}
                <Text style={[
                  styles.filterText,
                  selectedFilter === 'created' && styles.filterTextActive
                ]}>
                  Created
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading your events...</Text>
            </View>
          ) : groupedEvents.length === 0 ? (
            <Animatable.View 
              animation="fadeIn"
              duration={500}
              style={styles.emptyContainer}
            >
              <MaterialIcons name="event-busy" size={70} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'attended'
                  ? "You haven't attended any events yet."
                  : "You haven't created any events yet."}
              </Text>
              {selectedFilter === 'created' && (
                <TouchableOpacity
                  style={styles.createEventButton}
                  onPress={() => router.push('/(tabs)/Create')}
                >
                  <Text style={styles.createEventButtonText}>Create an Event</Text>
                </TouchableOpacity>
              )}
            </Animatable.View>
          ) : (
            <FlatList
              data={groupedEvents}
              renderItem={renderMonthSection}
              keyExtractor={item => item.monthYear}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            />
          )}
        </View>
      </ScreenWrapper>
    </>
  );
}

// Helper function to safely format event dates
const formatEventDate = (date: any) => {
  try {
    // Use the toDateObject utility to safely convert any date format
    const eventDate = toDateObject(date);
    
    if (!eventDate) {
      return 'Invalid date';
    }
    
    // Use formatDateWithTimezone with a custom format string
    return formatDateWithTimezone(eventDate, 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

// Platform-specific shadows
const cardShadow = createShadow(4); 
const buttonShadow = createShadow(3);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.secondaryText,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    ...cardShadow,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  filterTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    transform: [{scale: 1.02}],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondaryText,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: 12,
    paddingLeft: 4,
    letterSpacing: 0.2,
  },
  eventCardContainer: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventCardHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  eventImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(2),
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  eventDetails: {
    marginLeft: 14,
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginLeft: 6,
    flex: 1,
    letterSpacing: 0.3,
  },
  eventStatusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
    lineHeight: 22,
  },
  createEventButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    ...buttonShadow,
    minWidth: 200,
    alignItems: 'center',
  },
  createEventButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});