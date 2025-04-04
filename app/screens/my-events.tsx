// app/screens/my-events.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import eventService, { Event as EventType } from '../services/eventServices';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Filter types for events
type FilterType = 'all' | 'active' | 'past' | 'draft';

export default function MyEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Fetch my events
  const fetchEvents = async () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    
    try {
      setIsLoading(true);
      const myEvents = await eventService.getUserEvents(user.id);
      
      // Sort events by date (newest first)
      const sortedEvents = myEvents.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      setEvents(sortedEvents);
      
      // Start animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error fetching my events:', error);
      Alert.alert('Error', 'Failed to load your events. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };
  
  // Determine event status
  const getEventStatus = (event: EventType) => {
    if (!event || !event.date) return 'unknown';
    
    const now = new Date();
    const eventDate = event.date instanceof Date ? event.date : event.date.toDate();
    const eventTime = event.time instanceof Date ? event.time : event.time.toDate();
    
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
  };
  
  // Filter events based on selected filter
  useEffect(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let result = [...events];
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'active') {
        result = result.filter(event => ['upcoming', 'ongoing'].includes(getEventStatus(event)));
      } else if (selectedFilter === 'past') {
        result = result.filter(event => getEventStatus(event) === 'completed');
      } else if (selectedFilter === 'draft') {
        // In a real app, you would have a 'draft' status for unpublished events
        // For demo purposes, we'll just show an empty list
        result = [];
      }
    }
    
    setFilteredEvents(result);
  }, [selectedFilter, events]);
  
  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [user?.id]);

  const formatDate = (date: Date | { toDate: () => Date }) => {
    if (!date) return 'No date';
    const eventDate = date instanceof Date ? date : date.toDate();
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date | { toDate: () => Date }) => {
    if (!time) return '';
    const eventTime = time instanceof Date ? time : time.toDate();
    return eventTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Generate consistent colors based on text
  const getEventColor = (text: string) => {
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
  
  // Get badge color based on status
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'upcoming':
        return styles.upcomingBadge;
      case 'ongoing':
        return styles.ongoingBadge;
      case 'completed':
        return styles.completedBadge;
      default:
        return styles.unknownBadge;
    }
  };
  
  // Get badge text color
  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'upcoming':
        return styles.upcomingText;
      case 'ongoing':
        return styles.ongoingText;
      case 'completed':
        return styles.completedText;
      default:
        return styles.unknownText;
    }
  };

  const renderEventCard = ({ item }: { item: EventType }) => {
    const status = getEventStatus(item);
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.eventTopRow}>
          {/* Event image or placeholder */}
          <View style={styles.eventImageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
            ) : (
              <View style={[styles.eventImagePlaceholder, { backgroundColor: getEventColor(item.title) }]}>
                <Text style={styles.eventImageText}>{item.title.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.eventTopContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
            
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
            
            {/* Status badge */}
            <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(status)]}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.eventBottomRow}>
          {/* Attendee count */}
          <View style={styles.attendeeContainer}>
            <FontAwesome name="users" size={14} color="#6B7280" />
            <Text style={styles.attendeeText}>
              {item.attendees ? item.attendees.length : 0} Attendees
            </Text>
          </View>
          
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
            >
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => router.push(`//screens/edit-event?id=${item.id}`)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render empty state with suggestions based on filter
  const renderEmptyState = () => {
    let message = 'You haven\'t created any events yet.';
    let suggestion = 'Create your first event to get started!';
    
    if (selectedFilter === 'active') {
      message = 'You don\'t have any active events.';
      suggestion = 'Create a new event or check your past events.';
    } else if (selectedFilter === 'past') {
      message = 'You don\'t have any past events.';
      suggestion = 'Events that have ended will appear here.';
    } else if (selectedFilter === 'draft') {
      message = 'You don\'t have any draft events.';
      suggestion = 'Start creating an event and save it as a draft.';
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>{message}</Text>
        <Text style={styles.emptySubtext}>{suggestion}</Text>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/screens/Create')}
        >
          <FontAwesome name="plus" size={14} color="#FFFFFF" style={{marginRight: 8}} />
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 20) }
      ]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>My Events</Text>
        
        <TouchableOpacity
          style={styles.createHeaderButton}
          onPress={() => router.push('/screens/Create')}
        >
          <FontAwesome name="plus" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Filter tabs */}
      <Animated.View 
        style={[
          styles.filterContainer,
          { opacity: fadeAnim }
        ]}
      >
        {['all', 'active', 'past', 'draft'].map(filter => (
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
      </Animated.View>
      
      {/* Events list */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your events...</Text>
        </View>
      ) : (
        <Animated.View 
          style={[
            styles.listContainer,
            { opacity: fadeAnim }
          ]}
        >
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
                tintColor="#007AFF"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

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
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  createHeaderButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 10,
    ...cardShadow,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterButtonActive: {
    borderBottomColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    flex: 1,
  },
  eventList: {
    padding: 16,
    paddingBottom: 30,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  eventTopRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  eventTopContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
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
  unknownBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  unknownText: {
    color: '#6B7280',
  },
  eventBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  attendeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    color: 'white',
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
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...buttonShadow,
    marginTop: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});