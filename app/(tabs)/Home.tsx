// app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  useColorScheme as RNUseColorScheme,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import eventService, { Event } from '../services/eventServices';
import { useAuth } from '../AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { HelloWave } from '@/components/HelloWave';
import { createShadow } from '../utils/platformUtils';

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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

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

  const renderEventCard = ({ item, index }: { item: Event, index: number }) => {
    // Create individual animations for each card
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
          style={[
            styles.eventCard,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}
          onPress={() => router.push(`/screens/eventdetails?id=${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.eventImageWrapper}>
            {item.imageUrl ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.eventImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.imageGradient}
                />
              </View>
            ) : (
              <View style={[styles.eventImagePlaceholder, { backgroundColor: getEventColor(item.title) }]}>
                <Text style={styles.eventImageText}>{item.title.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            
            {/* Event status badge */}
            <View style={styles.eventStatusBadge}>
              <Text style={styles.eventStatusText}>
                {getEventStatus(item)}
              </Text>
            </View>
          </View>

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
      </Animated.View>
    );
  };

  // Get event status
  const getEventStatus = (event: Event) => {
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
      return 'Live';
    } else {
      return 'Past';
    }
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

  const renderFeaturedEvent = () => {
    if (!featuredEvent) return null;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }}
      >
        <TouchableOpacity
          style={styles.featuredContainer}
          onPress={() => router.push(`/screens/eventdetails?id=${featuredEvent.id}`)}
          activeOpacity={0.8}
        >
          {featuredEvent.imageUrl ? (
            <Image 
              source={{ uri: featuredEvent.imageUrl }} 
              style={styles.featuredImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.featuredImage, { backgroundColor: getEventColor(featuredEvent.title) }]}>
              <Text style={styles.featuredImageText}>{featuredEvent.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
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
      </Animated.View>
    );
  };

  const renderMyEventsSection = () => {
    if (!user) return null;
    
    return (
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Events You're Hosting
          </Text>
          {myEvents.length > 0 && (
            <TouchableOpacity 
              onPress={() => router.push('/screens/my-events')}
              style={styles.seeAllButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionAction, { color: Colors[colorScheme ?? 'light'].tint }]}>
                See All
              </Text>
              <FontAwesome name="chevron-right" size={12} color={Colors[colorScheme ?? 'light'].tint} style={{marginLeft: 4}} />
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
            initialNumToRender={2}
          />
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
              You haven't created any events yet.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/Create')}
              activeOpacity={0.7}
            >
              <FontAwesome name="plus" size={14} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
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
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, { color: Colors[colorScheme ?? 'light'].invertedText }]}>
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </Text>
            <HelloWave />
          </View>
          <Text style={[styles.subtitleText, { color: Colors[colorScheme ?? 'light'].invertedText }]}>
            Discover exciting events near you
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => router.push('/screens/scan')}
            activeOpacity={0.7}
          >
            <FontAwesome name="qrcode" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Event */}
      {!loading && featuredEvent && renderFeaturedEvent()}

      {/* Upcoming Events Section */}
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Upcoming Events
          </Text>
          {upcomingEvents.length > 0 && (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/Explore')}
              style={styles.seeAllButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionAction, { color: Colors[colorScheme ?? 'light'].tint }]}>
                See All
              </Text>
              <FontAwesome name="chevron-right" size={12} color={Colors[colorScheme ?? 'light'].tint} style={{marginLeft: 4}} />
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
            initialNumToRender={2}
          />
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].secondaryText }]}>
              No upcoming events found.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/Explore')}
              activeOpacity={0.7}
            >
              <FontAwesome name="search" size={14} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.createButtonText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* My Events Section */}
      {renderMyEventsSection()}

      {/* Activity Feed Section */}
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Recent Activity
          </Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} style={styles.loader} />
        ) : (
          <View style={[styles.activityContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            {events.length > 0 ? (
              events.slice(0, 3).map((event, index) => (
                <TouchableOpacity 
                  key={event.id}
                  style={[
                    styles.activityItem,
                    index < events.slice(0, 3).length - 1 && styles.activityItemBorder,
                    { borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]}
                  onPress={() => router.push(`/screens/eventdetails?id=${event.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activityIconContainer, { backgroundColor: getEventColor(event.title) }]}>
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
                  <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].secondaryText, padding: 16 }]}>
                No recent activity.
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

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
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginRight: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: 200,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
    marginBottom: 16,
    ...cardShadow,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImageText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  horizontalList: {
    paddingRight: 16,
  },
  eventCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    ...cardShadow,
    marginRight: 16,
  },
  eventImageWrapper: {
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  eventImage: {
    height: 120,
    width: '100%',
  },
  eventImagePlaceholder: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  eventStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
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
    ...cardShadow,
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
    flexDirection: 'row',
    alignItems: 'center',
    ...buttonShadow,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  activityContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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