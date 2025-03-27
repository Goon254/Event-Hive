// app/(tabs)/explore.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import eventService from '../services/eventServices';

// Types for filtering
type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'attending';

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendingEvents, setAttendingEvents] = useState([]);

  // Fetch events from service
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await eventService.getEvents();
      
      // If user is logged in, fetch events they're attending
      if (user) {
        const attending = await eventService.getUserAttendingEvents(user.id);
        setAttendingEvents(attending.map(event => event.id));
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events. Please try again.');
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

  // Determine event status based on date and time
  const getEventStatus = (event) => {
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

  const formatDate = (date) => {
    if (!date) return 'No date';
    const eventDate = date instanceof Date ? date : date.toDate();
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const eventTime = time instanceof Date ? time : time.toDate();
    return eventTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEventCard = ({ item }) => {
    const status = getEventStatus(item);
    const isAttending = attendingEvents.includes(item.id);
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/(tabs)/event-details/${item.id}`)}
      >
        {/* Event image or placeholder */}
        <View style={styles.eventImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
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
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
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
        </View>
      </TouchableOpacity>
    );
  };
  
  // Function to generate consistent colors based on text
  const getColorForEvent = (text) => {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Events</Text>
      </View>
      
      <View style={styles.searchContainer}>
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
      </View>

      <View style={styles.filterContainer}>
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
      </View>

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
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No events found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
            {selectedFilter !== 'all' && searchQuery.length === 0 && (
              <Text style={styles.emptySubtext}>Try changing your filter</Text>
            )}
          </View>
        }
      />
      
      {user && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/Create')}
        >
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
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
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  eventImageContainer: {
    position: 'relative',
    height: 120,
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
    bottom: 32,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});