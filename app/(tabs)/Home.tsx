// app/(tabs)/Home.tsx
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
  Platform,
  TextInput,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import eventService, { Event } from '../services/eventServices';
import { useAuth } from '../AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { HelloWave } from '@/components/HelloWave';
import { createShadow } from '../utils/platformUtils';
import { formatDate, formatTime, getRelativeDays } from '../utils/dateUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

// Filter types for events
type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed';

// Categories for events
const EVENT_CATEGORIES = [
  { id: 'music', name: 'Music', icon: 'music' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'tech', name: 'Technology', icon: 'laptop' },
  { id: 'sports', name: 'Sports', icon: 'futbol-o' },
  { id: 'food', name: 'Food', icon: 'cutlery' },
  { id: 'arts', name: 'Arts', icon: 'paint-brush' },
  { id: 'education', name: 'Education', icon: 'graduation-cap' },
  { id: 'health', name: 'Health', icon: 'heartbeat' }
];

export default function EnhancedHomeScreen() {
  const colorScheme = useColorScheme();
  const systemColorScheme = RNUseColorScheme();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<string[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const exploreModalTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  
  // Create a shared pool of animation values for list items
  const itemAnimations = useRef<{
    fadeAnim: Animated.Value[],
    translateY: Animated.Value[]
  }>({
    fadeAnim: [],
    translateY: []
  });

  // Initialize animations when component mounts
  useEffect(() => {
    // Pre-allocate animation values for a reasonable number of items
    const maxItems = 20;
    itemAnimations.current = {
      fadeAnim: Array(maxItems).fill(0).map(() => new Animated.Value(0)),
      translateY: Array(maxItems).fill(0).map(() => new Animated.Value(20))
    };
  }, []);

  // Function to animate list items
  const animateListItems = useCallback((count: number) => {
    const animations: Animated.CompositeAnimation[] = [];
    
    for (let i = 0; i < count; i++) {
      if (i < itemAnimations.current.fadeAnim.length) {
        const delay = i * 50;
        animations.push(
          Animated.timing(itemAnimations.current.fadeAnim[i], {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
          })
        );
        animations.push(
          Animated.timing(itemAnimations.current.translateY[i], {
            toValue: 0,
            duration: 300,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          })
        );
      }
    }
    
    Animated.parallel(animations).start();
  }, []);

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
      
      // Simulate nearby events by taking a random subset
      const shuffled = [...sortedEvents].sort(() => 0.5 - Math.random());
      setNearbyEvents(shuffled.slice(0, 5));
      
      // Filter for user's events if user is logged in
      if (user?.id) {
        const userEvents = sortedEvents.filter(event => event.createdBy === user.id);
        setMyEvents(userEvents);
        
        // Fetch events the user is attending
        const attending = await eventService.getUserAttendingEvents(user.id);
        setAttendingEvents(attending.map(event => event.id));
      }
      
      // Set filtered events initially to all events
      setFilteredEvents(sortedEvents);
      
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
      
      // Trigger animations for list items
      const maxCount = Math.max(
        upcoming.length,
        shuffled.slice(0, 5).length,
        user?.id ? sortedEvents.filter(event => event.createdBy === user.id).length : 0
      );
      animateListItems(maxCount);
      
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, animateListItems]);

  // Filter events for the explore modal
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
      const category = EVENT_CATEGORIES.find(cat => cat.id === selectedCategory);
      if (category) {
        result = result.filter(event => 
          event.title.toLowerCase().includes(category.name.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(category.name.toLowerCase()))
        );
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
  }, [selectedFilter, selectedCategory, searchQuery, events]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Get event status
  const getEventStatus = (event: Event) => {
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

  const getDaysUntil = (date: Date | any) => {
    if (!date) return '';
    const eventDate = date instanceof Date ? date : date.toDate();
    const now = new Date();
    const diffTime = Math.abs(eventDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  // Show explore modal with animation
  const handleShowExplore = () => {
    setShowExploreModal(true);
    Animated.timing(exploreModalTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  };

  // Hide explore modal with animation
  const handleHideExplore = () => {
    Animated.timing(exploreModalTranslateY, {
      toValue: Dimensions.get('window').height,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease)
    }).start(() => {
      setShowExploreModal(false);
    });
  };

  // Reset explore filters
  const handleResetFilters = () => {
    setSelectedFilter('all');
    setSelectedCategory(null);
    setSearchQuery('');
  };

  // Render event card with animations from the shared pool
  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const isAttending = attendingEvents.includes(item.id);
    const status = getEventStatus(item);
    
    // Safely access animation values from the pool
    const fadeValue = index < itemAnimations.current.fadeAnim.length 
      ? itemAnimations.current.fadeAnim[index] 
      : new Animated.Value(1);
    
    const translateValue = index < itemAnimations.current.translateY.length 
      ? itemAnimations.current.translateY[index] 
      : new Animated.Value(0);
    
    return (
      <Animated.View
        style={{
          opacity: fadeValue,
          transform: [{ translateY: translateValue }]
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
                {status.toUpperCase()}
              </Text>
            </View>
            
            {/* Attending indicator */}
            {isAttending && (
              <View style={styles.attendingBadge}>
                <MaterialIcons name="check-circle" size={16} color="#FFF" />
              </View>
            )}
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
            {item.isPaid && (
              <View style={styles.eventMetaRow}>
                <FontAwesome name="ticket" size={14} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.eventMetaText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  ${item.price?.toFixed(2) || '0.00'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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

  const renderCategoryButtons = () => {
    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {EVENT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryButton}
              onPress={() => {
                setSelectedCategory(category.id);
                handleShowExplore();
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: getEventColor(category.name) }]}>
                <FontAwesome name={category.icon as any} size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
              onPress={() => router.push('/screens/event-history')}
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
              onPress={() => router.push('/screens/Create')}
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

  const renderNearbyEventsSection = () => {
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
            Events Near You
          </Text>
          <TouchableOpacity 
            onPress={handleShowExplore}
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionAction, { color: Colors[colorScheme ?? 'light'].tint }]}>
              See All
            </Text>
            <FontAwesome name="chevron-right" size={12} color={Colors[colorScheme ?? 'light'].tint} style={{marginLeft: 4}} />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} style={styles.loader} />
        ) : nearbyEvents.length > 0 ? (
          <FlatList
            data={nearbyEvents}
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
              No nearby events found.
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderUpcomingEventsSection = () => {
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
            Upcoming Events
          </Text>
          {upcomingEvents.length > 0 && (
            <TouchableOpacity 
              onPress={handleShowExplore}
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
              onPress={() => router.push('/screens/Explore')}
              activeOpacity={0.7}
            >
              <FontAwesome name="search" size={14} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.createButtonText}>Explore Events</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  // Render Explore Modal
  const renderExploreModal = () => {
    if (!showExploreModal) return null;
    
    return (
      <Modal
        visible={showExploreModal}
        animationType="none"
        transparent={true}
        onRequestClose={handleHideExplore}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.exploreModalContainer,
              {
                transform: [{ translateY: exploreModalTranslateY }]
              }
            ]}
          >
            {/* Modal Header */}
            <View style={styles.exploreHeader}>
              <TouchableOpacity 
                onPress={handleHideExplore}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.exploreTitle}>Explore Events</Text>
              <TouchableOpacity 
                onPress={handleResetFilters}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            {/* Search Bar */}
            <View style={styles.exploreSearchContainer}>
              <FontAwesome name="search" size={18} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.exploreSearchInput}
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
            
            {/* Filter Tabs */}
            <View style={styles.exploreFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'upcoming', 'ongoing', 'completed'].map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.exploreFilterButton,
                      selectedFilter === filter && styles.exploreFilterButtonActive,
                    ]}
                    onPress={() => setSelectedFilter(filter as FilterType)}
                  >
                    <Text
                      style={[
                        styles.exploreFilterButtonText,
                        selectedFilter === filter && styles.exploreFilterButtonTextActive,
                      ]}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Category Chips */}
            <View style={styles.exploreCategoriesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {EVENT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.exploreCategoryChip,
                      selectedCategory === category.id && styles.exploreCategoryChipSelected
                    ]}
                    onPress={() => setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )}
                  >
                    <FontAwesome 
                      name={category.icon as any} 
                      size={16} 
                      color={selectedCategory === category.id ? "#FFFFFF" : "#6B7280"} 
                    />
                    <Text style={[
                      styles.                      exploreCategoryChipText,
                      selectedCategory === category.id && styles.exploreCategoryChipTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Event List */}
            {loading ? (
              <View style={styles.exploreLoadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.exploreLoadingText}>Loading events...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredEvents}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.exploreEventCard}
                    onPress={() => {
                      handleHideExplore();
                      router.push(`/screens/eventdetails?id=${item.id}`);
                    }}
                  >
                    <View style={styles.exploreEventImageContainer}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.exploreEventImage} />
                      ) : (
                        <View style={[
                          styles.exploreEventImagePlaceholder,
                          { backgroundColor: getEventColor(item.title) }
                        ]}>
                          <Text style={styles.exploreEventImageText}>
                            {item.title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.exploreEventContent}>
                      <Text style={styles.exploreEventTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      
                      <View style={styles.exploreEventInfo}>
                        <View style={styles.exploreInfoRow}>
                          <FontAwesome name="calendar" size={14} color="#6B7280" />
                          <Text style={styles.exploreEventDetails}>
                            {formatDate(item.date)}
                          </Text>
                        </View>
                        
                        <View style={styles.exploreInfoRow}>
                          <FontAwesome name="map-marker" size={14} color="#6B7280" />
                          <Text style={styles.exploreEventDetails} numberOfLines={1}>
                            {item.location || "Location TBD"}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Status Badge */}
                      <View style={[
                        styles.exploreStatusBadge,
                        getEventStatus(item) === 'upcoming' && styles.exploreUpcomingBadge,
                        getEventStatus(item) === 'ongoing' && styles.exploreOngoingBadge,
                        getEventStatus(item) === 'completed' && styles.exploreCompletedBadge
                      ]}>
                        <Text style={[
                          styles.exploreStatusText,
                          getEventStatus(item) === 'upcoming' && styles.exploreUpcomingText,
                          getEventStatus(item) === 'ongoing' && styles.exploreOngoingText,
                          getEventStatus(item) === 'completed' && styles.exploreCompletedText
                        ]}>
                          {getEventStatus(item).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.exploreEventList}
                ListEmptyComponent={
                  <View style={styles.exploreEmptyContainer}>
                    <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
                    <Text style={styles.exploreEmptyText}>No events found</Text>
                    <Text style={styles.exploreEmptySubtext}>
                      {searchQuery ? 'Try adjusting your search or filters' : 'No events match your current filters'}
                    </Text>
                  </View>
                }
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView 
        style={styles.container}
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

        {/* Explore Button */}
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={handleShowExplore}
          activeOpacity={0.8}
        >
          <FontAwesome name="search" size={16} color="#6B7280" />
          <Text style={styles.exploreButtonText}>Explore all events</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* Categories */}
        {renderCategoryButtons()}

        {/* Featured Event */}
        {!loading && featuredEvent && renderFeaturedEvent()}

        {/* Events by section */}
        {renderUpcomingEventsSection()}
        {renderNearbyEventsSection()}
        {renderMyEventsSection()}
      </ScrollView>

      {/* Explore Events Modal */}
      {renderExploreModal()}
{/* Floating Action Button for Event Creation */}
<TouchableOpacity 
  style={styles.createEventFAB}
  onPress={() => router.push('/screens/Create')}
  activeOpacity={0.8}
>
  <LinearGradient
    colors={['#007AFF', '#4F46E5']}
    style={styles.fabGradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <FontAwesome name="plus" size={24} color="#FFFFFF" />
  </LinearGradient>
</TouchableOpacity>


    </View>
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
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    ...cardShadow,
  },
  exploreButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...buttonShadow,
  },
  categoryText: {
    fontSize: 12,
    color: '#4B5563',
  },
  featuredContainer: {
    width: width - 32,
    height: 200,
    marginHorizontal: 16,
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
  attendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    borderRadius: 20,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
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
  createEventFAB: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...buttonShadow,
    borderRadius: 28,
    elevation: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  exploreModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...cardShadow,
  },
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  exploreSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  exploreSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  exploreFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exploreFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  exploreFilterButtonActive: {
    backgroundColor: '#007AFF',
  },
  exploreFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  exploreFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  exploreCategoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exploreCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  exploreCategoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  exploreCategoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  exploreCategoryChipTextSelected: {
    color: '#FFFFFF',
  },
  exploreEventList: {
    padding: 16,
    paddingBottom: 120,
  },
  exploreEventCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  exploreEventImageContainer: {
    width: 100,
    height: 100,
  },
  exploreEventImage: {
    width: '100%',
    height: '100%',
  },
  exploreEventImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreEventImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  exploreEventContent: {
    flex: 1,
    padding: 12,
    position: 'relative',
  },
  exploreEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  exploreEventInfo: {
    flex: 1,
  },
  exploreInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exploreEventDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  exploreStatusBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exploreUpcomingBadge: {
    backgroundColor: '#EFF6FF',
  },
  exploreOngoingBadge: {
    backgroundColor: '#ECFDF5',
  },
  exploreCompletedBadge: {
    backgroundColor: '#FEF2F2',
  },
  exploreStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exploreUpcomingText: {
    color: '#1D4ED8',
  },
  exploreOngoingText: {
    color: '#047857',
  },
  exploreCompletedText: {
    color: '#B91C1C',
  },
  exploreLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  exploreLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  exploreEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  exploreEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  exploreEmptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  }
  ,
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  }
});