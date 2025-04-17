// app/(tabs)/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { COLORS, GRADIENTS } from '../theme/constants';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  Animated as RNAnimated,
  Dimensions,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { createShadow } from '../utils/platformUtils';
import ScreenLayout from '../components/common/ScreenLayout';

// Import components from home directory
import {
  EventCard,
  FeaturedEvent,
  EventSection,
  ExploreModal,
  useEventData,
  useAnimations
} from '../components/home';
import { EVENT_CATEGORIES } from '../components/home/CategoryButtons';
import { getEventColor } from '../components/home/utils/uiHelpers';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Modern Home screen component with enhanced visual design
 * Implements a clean, spacious layout with subtle animations
 */
export default function Home() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  // Force dark mode for the background
  const isDark = true;
  
  // Scroll animation value
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  
  // Use the event data hook to manage all event-related state and operations
  const {
    events,
    upcomingEvents,
    nearbyEvents,
    myEvents,
    featuredEvent,
    filteredEvents,
    attendingEvents,
    loading,
    refreshing,
    error,
    isOffline,
    searchQuery,
    selectedFilter,
    selectedCategory,
    setSearchQuery,
    setSelectedFilter,
    setSelectedCategory,
    loadEvents,
    refreshEvents,
    resetFilters,
    retryLoading,
    getEventStatus,
    getDaysUntil,
    isUserAttending
  } = useEventData(user?.id);
  
  // Use the animations hook to manage all animations
  const {
    fadeAnim,
    translateY,
    exploreModalTranslateY,
    animateListItems,
    animateContentAppearance,
    showExploreModal,
    hideExploreModal,
    getItemAnimationValues
  } = useAnimations();
  
  // Explore modal state
  const [exploreModalVisible, setExploreModalVisible] = useState(false);
  
  // Animate content on mount with enhanced timing
  useEffect(() => {
    // Initial appearance animation
    animateContentAppearance();
    
    // Staggered animations for list items
    const timer = setTimeout(() => {
      animateListItems(events.length);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [animateContentAppearance, animateListItems, events.length]);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    handleOpenExploreModal();
  };
  
  // Handle opening the explore modal
  const handleOpenExploreModal = () => {
    setExploreModalVisible(true);
    showExploreModal();
  };
  
  // Handle closing the explore modal
  const handleCloseExploreModal = () => {
    hideExploreModal(() => {
      setExploreModalVisible(false);
    });
  };
  
  // Use the centralized theme colors
  const theme = COLORS;

  // Header animation based on scroll position - using scale instead of height for native animation support
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.7],
    extrapolate: 'clamp'
  });
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -15],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp'
  });

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [1, 0.9, 0], // Fade out as it moves up
    extrapolate: 'clamp'
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50], // Moves up as the user scrolls
    extrapolate: 'clamp'
  });

  // Calculate the top area height (header + search bar + status bar spacer)
  const headerTopHeight = Platform.OS === 'ios' ? 240 : 220;

  return (
    <ScreenLayout
      backgroundColor={theme.background}
      statusBarColor={theme.background}
      statusBarStyle="light-content"
    >
      {/* Animated Header */}
      <RNAnimated.View style={[
        styles.header,
        { 
          height: Platform.OS === 'ios' ? 130 : 110,
          transform: [
            { translateY: headerTranslateY },
            { scaleY: headerScale }
          ],
          transformOrigin: 'top'
        }
      ]}>
        <LinearGradient
          colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <RNAnimated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <View>
              <Text style={styles.welcomeText}>
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Text>
              <Text style={styles.subtitleText}>
                Discover exciting events near you
              </Text>
            </View>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/screens/NearbyEventsScreen')}
              >
                <MaterialIcons name="map" size={22} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/screens/scan')}
              >
                <FontAwesome name="qrcode" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </RNAnimated.View>
        </LinearGradient>
      </RNAnimated.View>
      
      {/* Floating "Explore all events" Button */}
<RNAnimated.View style={[
  styles.searchBarContainer,
  { 
    transform: [{ translateY: searchBarTranslateY }],
    opacity: searchBarOpacity // Add opacity animation
  }
]}>
  <TouchableOpacity
    style={[styles.searchBar, { backgroundColor: theme.card }]}
    activeOpacity={0.8}
    onPress={() => router.push('/screens/Explore')}
  >
    <FontAwesome name="search" size={18} color={theme.secondaryText} />
    <Text style={[styles.searchText, { color: theme.secondaryText }]}>
      Explore all events
    </Text>
    <MaterialIcons name="arrow-forward" size={20} color={theme.secondaryText} />
  </TouchableOpacity>
</RNAnimated.View>

      {/* Main Content */}
      <RNAnimated.FlatList
        data={[]}
        renderItem={null}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            {/* Spacer for header and search bar - adjusted for status bar spacer */}
            <View style={{ height: headerTopHeight + (Platform.OS === 'ios' ? 80 : 60) }} />
            
            {/* Categories section - now part of the scrolling content */}
            <View style={styles.categoriesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryButton}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <View style={[
                      styles.categoryIcon, 
                      { backgroundColor: getEventColor(category.name) }
                    ]}>
                      <FontAwesome name={category.icon as any} size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.categoryText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Loading State with simple fade animation (similar to feed section) */}
            {loading && (
              <RNAnimated.View 
                style={[
                  styles.loadingContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY }]
                  }
                ]}
              >
                <MaterialIcons name="hourglass-empty" size={64} color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
                  Loading events...
                </Text>
              </RNAnimated.View>
            )}
            
            {/* Error State with improved visuals */}
            {error && !loading && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={64} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.text }]}>
                  Unable to load events
                </Text>
                <Text style={[styles.errorSubtext, { color: theme.secondaryText }]}>
                  {error.message}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: theme.error }]}
                  activeOpacity={0.8}
                  onPress={retryLoading}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Featured Event with full-width design */}
            {!loading && featuredEvent && (
              <View style={styles.featuredEventContainer}>
                <FeaturedEvent
                  event={featuredEvent}
                  daysUntil={getDaysUntil(featuredEvent.date)}
                  fadeAnim={fadeAnim}
                  translateY={translateY}
                />
              </View>
            )}
            
            {/* Upcoming Events */}
            {!loading && upcomingEvents.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Events</Text>
                  <TouchableOpacity onPress={() => router.push('/screens/Explore')}>
                    <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>See All</Text>
                  </TouchableOpacity>
                </View>
                
                <RNAnimated.ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {upcomingEvents.slice(0, 5).map((item, index) => {
                    const { fadeValue, translateValue } = getItemAnimationValues(index);
                    return (
                      <EventCard
                        key={item.id || `event-${index}`}
                        item={item}
                        index={index}
                        isAttending={attendingEvents.includes(item.id)}
                        status={getEventStatus(item)}
                        fadeValue={fadeValue}
                        translateValue={translateValue}
                      />
                    );
                  })}
                </RNAnimated.ScrollView>
              </View>
            )}
            
            {/* Nearby Events */}
            {!loading && nearbyEvents.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Events Near You</Text>
                  <TouchableOpacity onPress={() => router.push('/screens/Explore')}>
                    <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>See All</Text>
                  </TouchableOpacity>
                </View>
                
                <RNAnimated.ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {nearbyEvents.map((item, index) => {
                    const { fadeValue, translateValue } = getItemAnimationValues(index);
                    return (
                      <EventCard
                        key={item.id || `nearby-${index}`}
                        item={item}
                        index={index}
                        isAttending={attendingEvents.includes(item.id)}
                        status={getEventStatus(item)}
                        fadeValue={fadeValue}
                        translateValue={translateValue}
                      />
                    );
                  })}
                </RNAnimated.ScrollView>
              </View>
            )}
            
            {/* My Events */}
            {!loading && user && (
              <View style={[styles.sectionContainer, { marginBottom: 40 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Events</Text>
                  <TouchableOpacity onPress={() => router.push('/screens/event-history')}>
                    <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>See All</Text>
                  </TouchableOpacity>
                </View>
                
                {myEvents.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 16, color: theme.secondaryText, textAlign: 'center', marginBottom: 20 }}>
                      You haven't created any events yet
                    </Text>
                    <TouchableOpacity
                      style={{ backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                      onPress={() => router.push('/screens/Create')}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Create Event</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <RNAnimated.ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContent}
                  >
                    {myEvents.map((item, index) => {
                      const { fadeValue, translateValue } = getItemAnimationValues(index);
                      return (
                        <EventCard
                          key={item.id || `my-${index}`}
                          item={item}
                          index={index}
                          isAttending={attendingEvents.includes(item.id)}
                          status={getEventStatus(item)}
                          fadeValue={fadeValue}
                          translateValue={translateValue}
                        />
                      );
                    })}
                  </RNAnimated.ScrollView>
                )}
              </View>
            )}
            
            {/* Bottom Spacer */}
            <View style={{ height: 120 }} />
          </>
        }
        keyExtractor={() => 'home-content'}
        ListEmptyComponent={null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEvents}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressBackgroundColor={theme.card}
          />
        }
      />

      {/* Explore Modal */}
      <ExploreModal
        visible={exploreModalVisible}
        events={filteredEvents}
        searchQuery={searchQuery}
        selectedFilter={selectedFilter}
        selectedCategory={selectedCategory}
        getEventStatus={getEventStatus}
        onClose={handleCloseExploreModal}
        onReset={resetFilters}
        onSearchChange={setSearchQuery}
        onFilterChange={setSelectedFilter}
        onCategoryChange={setSelectedCategory}
        translateY={exploreModalTranslateY}
        loading={loading}
      />

      {/* Enhanced Floating Action Button */}
      <RNAnimated.View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => router.push('/screens/Create')}
        >
          <LinearGradient
            colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome name="plus" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </RNAnimated.View>
    </ScreenLayout>
  );
}

// Enhanced shadows for better depth
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  // Enhanced Header - no borders or outlines
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, // Adjusted to account for status bar spacer
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30, // Extra padding at bottom
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 32, // Larger text
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 18, // Larger text
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16, // Increased spacing
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48, // Slightly larger
    height: 48, // Slightly larger
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Floating Search Bar - modified to "Explore all events" button
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 230 : 190, // Adjusted to account for status bar spacer
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: 24, // Wider padding
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Spread out the items
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A', // Match the theme.card color
  },
  searchText: {
    flex: 1, // Take up available space
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Categories section - now integrated into the scrolling content
  categoriesSection: {
    marginBottom: 24,
    paddingVertical: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
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
    ...buttonShadow,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
  },
  
  // Featured event container
  featuredEventContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  
  // Section containers
  sectionContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Horizontal scroll content
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  
  // Enhanced Loading State - no borders
  loadingContainer: {
    marginTop: 24,
    marginBottom: 24,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '500',
  },
  
  // Enhanced Error State - no borders
  errorContainer: {
    marginTop: 24,
    marginBottom: 24,
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Empty state
  emptyContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    padding: 30,
    alignItems: 'center',
  },
  
  // Enhanced FAB - no borders
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    zIndex: 10,
  },
  fab: {
    borderRadius: 32,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  }
});