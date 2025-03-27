// app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  useColorScheme as RNUseColorScheme
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import eventService, { Event } from '../services/eventServices';
import { useAuth } from '../AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const systemColorScheme = RNUseColorScheme();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const eventsData = await eventService.getEvents();
      
      // Sort events by date (newest first)
      const sortedEvents = eventsData.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      setEvents(sortedEvents);
      
      // Filter for upcoming events (events in the future)
      const now = new Date();
      const upcoming = sortedEvents.filter(event => {
        const eventDate = event.date instanceof Date ? event.date : event.date.toDate();
        return eventDate > now;
      });
      setUpcomingEvents(upcoming);
      
      // Set featured event (closest upcoming event)
      if (upcoming.length > 0) {
        setFeaturedEvent(upcoming[0]);
      }
      
      // Filter for user's events if user is logged in
      if (user?.id) {
        const userEvents = sortedEvents.filter(event => event.createdBy === user.id);
        setMyEvents(userEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const formatDate = (date: Date | any) => {
    if (!date) return 'No date';
    const eventDate = date instanceof Date ? date : date.toDate();
    return eventDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | any) => {
    if (!date) return '';
    const eventDate = date instanceof Date ? date : date.toDate();
    return eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (date: Date | any) => {
    if (!date) return '';
    const eventDate = date instanceof Date ? date : date.toDate();
    const now = new Date();
    const diffTime = Math.abs(eventDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[
        styles.eventCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
      ]}
      onPress={() => router.push(`/event-details/${item.id}`)}
    >
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.eventImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.eventImage, { backgroundColor: '#E5E7EB' }]}>
          <FontAwesome name="calendar" size={28} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
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
          <Text style={[styles.eventMetaText, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        {item.attendees && (
          <View style={styles.eventMetaRow}>
            <FontAwesome name="users" size={14} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.eventMetaText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {item.attendees.length} attending
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedEvent = () => {
    if (!featuredEvent) return null;
    
    return (
      <TouchableOpacity
        style={styles.featuredContainer}
        onPress={() => router.push(`/event-details/${featuredEvent.id}`)}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={styles.featuredGradient}
        />
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{featuredEvent.title}</Text>
          <View style={styles.featuredDetailsRow}>
            <View style={styles.featuredDetail}>
              <FontAwesome name="calendar" size={16} color="#FFF" />
              <Text style={styles.featuredDetailText}>{formatDate(featuredEvent.date)}</Text>
            </View>
            <View style={styles.featuredDetail}>
              <FontAwesome name="clock-o" size={16} color="#FFF" />
              <Text style={styles.featuredDetailText}>{formatTime(featuredEvent.date)}</Text>
            </View>
          </View>
          <View style={styles.featuredCountdown}>
            <Text style={styles.featuredCountdownText}>
              {getDaysUntil(featuredEvent.date)} until event
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyEventsSection = () => {
    if (!user) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Events You're Hosting
          </Text>
          {myEvents.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/my-events')}>
              <Text style={[styles.sectionAction, { color: Colors[colorScheme ?? 'light'].tint }]}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} style={styles.loader} />
        ) : myEvents.length > 0 ? (
          <FlatList
            data={myEvents.slice(0, 5)}
            renderItem={renderEventCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
          />
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
              You haven't created any events yet.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/scan')}
            >
              <Text style={styles.createButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors[colorScheme ?? 'light'].tint]}
          tintColor={Colors[colorScheme ?? 'light'].tint}
        />
      }
    >
      {/* Header with welcome message */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: Colors[colorScheme ?? 'light'].invertedText }]}>
            Welcome{user?.name ? `, ${user.name}` : ' back'}!
          </Text>
          <Text style={[styles.subtitleText, { color: Colors[colorScheme ?? 'light'].invertedSecondaryText }]}>
            Let's discover exciting events
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => router.push('/scan')}
        >
          <FontAwesome name="qrcode" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Featured Event */}
      {!loading && featuredEvent && renderFeaturedEvent()}

      {/* Upcoming Events Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Upcoming Events
          </Text>
          {upcomingEvents.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={[styles.sectionAction, { color: Colors[colorScheme ?? 'light'].tint }]}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} style={styles.loader} />
        ) : upcomingEvents.length > 0 ? (
          <FlatList
            data={upcomingEvents.slice(0, 5)}
            renderItem={renderEventCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
          />
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
              No upcoming events found.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.createButtonText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* My Events Section */}
      {renderMyEventsSection()}

      {/* Activity Feed Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Recent Activity
          </Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} style={styles.loader} />
        ) : (
          <View style={[styles.activityContainer, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            {events.length > 0 ? (
              events.slice(0, 3).map((event, index) => (
                <TouchableOpacity 
                  key={event.id}
                  style={[
                    styles.activityItem,
                    index < events.slice(0, 3).length - 1 && styles.activityItemBorder
                  ]}
                  onPress={() => router.push(`/event-details/${event.id}`)}
                >
                  <View style={styles.activityIconContainer}>
                    <FontAwesome name="calendar-plus-o" size={16} color="#FFF" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                      New Event Added
                    </Text>
                    <Text style={[styles.activityMessage, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
                      {event.title} on {formatDate(event.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].secondaryText, padding: 16 }]}>
                No recent activity.
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#007AFF',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContainer: {
    width: width - 32,
    height: 180,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
    marginBottom: 16,
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    borderRadius: 16,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuredDetailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featuredDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredDetailText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 14,
  },
  featuredCountdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  featuredCountdownText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingRight: 16,
  },
  eventCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 16,
  },
  eventImage: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  activityContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  activityMessage: {
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
});