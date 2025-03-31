// app/screens/event-history.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { formatDate, formatTime, getRelativeDays } from '../utils/dateUtils';
import eventService, { Event } from '../services/eventServices';
import { Timestamp } from 'firebase/firestore';

// Type for the grouped events by month
interface EventsByMonth {
  monthYear: string;
  month: number;
  year: number;
  events: Event[];
}

export default function EventHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<EventsByMonth[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'attended' | 'created'>('all');

  useEffect(() => {
    fetchEventHistory();
  }, [user?.id]);

  useEffect(() => {
    // Group events by month whenever events or filter changes
    if (events.length > 0) {
      groupEventsByMonth();
    }
  }, [events, selectedFilter]);

  const fetchEventHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch both attended and created events
      const [attendedEvents, createdEvents] = await Promise.all([
        eventService.getUserAttendingEvents(user.id),
        eventService.getUserEvents(user.id)
      ]);
      
      // Mark the source of each event (attended or created)
      const markedAttended = attendedEvents.map(event => ({ ...event, source: 'attended' as const }));
      const markedCreated = createdEvents.map(event => ({ ...event, source: 'created' as const }));
      
      // Combine and sort by date (newest first)
      const allEvents = [...markedAttended, ...markedCreated].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      // Remove duplicates (might be both attended and created)
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      setEvents(uniqueEvents);
    } catch (error) {
      console.error('Error fetching event history:', error);
      Alert.alert('Error', 'Failed to load event history');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const groupEventsByMonth = () => {
    // Filter events based on selected filter
    const filteredEvents = events.filter(event => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'attended') return event.source === 'attended';
      if (selectedFilter === 'created') return event.source === 'created';
      return true;
    });
    
    // Group events by month and year
    const grouped: { [key: string]: EventsByMonth } = {};
    
    filteredEvents.forEach(event => {
      const date = event.date instanceof Date ? event.date : event.date.toDate();
      const month = date.getMonth();
      const year = date.getFullYear();
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

  const getStatusText = (event: Event): string => {
    if (!event || !event.date) return 'Unknown';
    
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
      return 'Upcoming';
    } else if (now >= eventDateTime && now <= eventEndTime) {
      return 'Ongoing';
    } else {
      return 'Past';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return '#3B82F6'; // Blue
      case 'Ongoing':
        return '#10B981'; // Green
      case 'Past':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
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

  const renderEventItem = ({ item }: { item: Event }) => {
    const status = getStatusText(item);
    const statusColor = getStatusColor(status);
    const eventColor = getEventColor(item.title);
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
      >
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
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.eventDate}>
                {formatDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.eventLocationContainer}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.eventLocation} numberOfLines={1}>
                {item.location || 'No location provided'}
              </Text>
            </View>
          </View>
          
          <View style={styles.eventStatusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
            
            {/* Show role badge (attended or organized) */}
            <View style={[styles.roleBadge, { 
              backgroundColor: item.source === 'created' ? '#FEF3C7' : '#EFF6FF'
            }]}>
              <Text style={[styles.roleText, { 
                color: item.source === 'created' ? '#D97706' : '#3B82F6'
              }]}>
                {item.source === 'created' ? 'Organized' : 'Attended'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMonthSection = ({ item }: { item: EventsByMonth }) => {
    return (
      <View style={styles.monthSection}>
        <Text style={styles.monthTitle}>{item.monthYear}</Text>
        {item.events.map(event => (
          <View key={event.id}>
            {renderEventItem({ item: event })}
          </View>
        ))}
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
        
        <Text style={styles.headerTitle}>Event History</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterText, 
            selectedFilter === 'all' && styles.filterTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'attended' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('attended')}
        >
          <Text style={[
            styles.filterText, 
            selectedFilter === 'attended' && styles.filterTextActive
          ]}>
            Attended
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'created' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('created')}
        >
          <Text style={[
            styles.filterText, 
            selectedFilter === 'created' && styles.filterTextActive
          ]}>
            Created
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your events...</Text>
        </View>
      ) : groupedEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-busy" size={60} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Events Found</Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all'
              ? "You haven't attended or created any events yet."
              : selectedFilter === 'attended'
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
        </View>
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
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    ...cardShadow,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  monthSection: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
    marginVertical: 8,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  eventCardHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  eventImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  eventStatusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
    lineHeight: 22,
  },
  createEventButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    ...buttonShadow,
  },
  createEventButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});