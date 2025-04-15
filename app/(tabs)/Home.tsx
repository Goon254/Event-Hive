// app/(tabs)/Home.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { createShadow } from '../utils/platformUtils';
import { useFeatureFlags } from '../utils/featureFlags';
import { useRenderTracking, trackInteraction } from '../utils/performance';

// Import custom hooks
import { useEventData, FilterType } from '../components/home/hooks/useEventData';
import { useAnimations } from '../components/home/hooks/useAnimations';

// Import components
import FeaturedEvent from '../components/home/FeaturedEvent';
import CategoryButtons from '../components/home/CategoryButtons';
import EventSection from '../components/home/EventSection';
import ExploreModal from '../components/home/ExploreModal';
import EventDebug from '../components/home/EventDebug';

/**
 * Home screen component - main screen of the app
 * Optimized for better performance and maintainability
 */
export default function Home() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [showExploreModal, setShowExploreModal] = useState(false);
  const { isEnabled } = useFeatureFlags();
  
  // Track component renders for performance monitoring
  useRenderTracking('Home');
  
  // Initialize animations
  const {
    fadeAnim,
    translateY,
    exploreModalTranslateY,
    animateListItems,
    animateContentAppearance,
    showExploreModal: animateShowModal,
    hideExploreModal: animateHideModal,
    getItemAnimationValues
  } = useAnimations();
  
  // Initialize event data with enhanced error handling
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
  
  // Handle showing explore modal - memoized to prevent recreating on each render
  const handleShowExplore = useCallback(() => {
    setShowExploreModal(true);
    animateShowModal();
  }, [animateShowModal]);
  
  // Handle hiding explore modal - memoized to prevent recreating on each render
  const handleHideExplore = useCallback(() => {
    animateHideModal(() => {
      setShowExploreModal(false);
    });
  }, [animateHideModal]);
  
  // Handle category selection - memoized to prevent recreating on each render
  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    handleShowExplore();
  }, [setSelectedCategory, handleShowExplore]);
  
  // Show error alert - only when error changes
  useEffect(() => {
    if (error) {
      Alert.alert(
        "Error Loading Events",
        error.message,
        [
          { text: "Retry", onPress: retryLoading },
          { text: "OK" }
        ]
      );
    }
  }, [error, retryLoading]);

  // Handle refresh with performance tracking - memoized to prevent recreating on each render
  const handleRefresh = useCallback(() => {
    trackInteraction('Refresh Events', async () => {
      refreshEvents();
      return true;
    });
  }, [refreshEvents]);

  // Use useMemo to prevent unnecessary re-renders of the content
  const renderContent = useMemo(() => (
    <View style={styles.pageContainer}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineBannerText}>
            You are offline. Some content may be unavailable.
          </Text>
        </View>
      )}
      
      <FlatList
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme ?? 'light'].tint]}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        // Add accessibility props
        accessible={true}
        accessibilityLabel="Home screen content"
        data={[1]} // Just need one item to render all content
        renderItem={() => (
          <>
        {/* Header with welcome message */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeText, { color: Colors[colorScheme ?? 'light'].invertedText }]}>
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Text>
              <Text style={[styles.subtitleText, { color: Colors[colorScheme ?? 'light'].invertedText }]}>
                Discover exciting events near you
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => router.push('/screens/NearbyEventsScreen')}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Find nearby events"
                accessibilityRole="button"
                accessibilityHint="Opens map with nearby events"
              >
                <MaterialIcons name="map" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push('/screens/scan')}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Scan QR code"
                accessibilityRole="button"
                accessibilityHint="Opens QR code scanner"
              >
                <FontAwesome name="qrcode" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Discovery Section - Contains explore button and categories */}
        <View style={styles.discoverySection}>
          {/* Explore Button */}
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={handleShowExplore}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Explore all events"
            accessibilityRole="button"
            accessibilityHint="Opens event explorer"
          >
            <FontAwesome name="search" size={16} color="#6B7280" />
            <Text style={styles.exploreButtonText}>Explore all events</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          
          {/* Categories */}
          <View style={styles.categoriesContainer}>
            <CategoryButtons
              onSelectCategory={handleSelectCategory}
              fadeAnim={fadeAnim}
              translateY={translateY}
            />
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.statusText}>Loading events...</Text>
          </View>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <View style={styles.statusContainer}>
            <MaterialIcons name="error-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Unable to load events</Text>
            <Text style={styles.errorSubtext}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Featured Event Section */}
        {!loading && featuredEvent && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Featured Event</Text>
            <View style={styles.sectionContent}>
              <FeaturedEvent
                event={featuredEvent}
                daysUntil={getDaysUntil(featuredEvent.date)}
                fadeAnim={fadeAnim}
                translateY={translateY}
              />
            </View>
          </View>
        )}

        {/* Events Sections */}
        <View style={styles.eventsSectionsContainer}>
          {/* Upcoming Events Section */}
          <View style={styles.sectionContainer}>
            <EventSection
              title="Upcoming Events"
              events={upcomingEvents}
              loading={loading}
              attendingEvents={attendingEvents}
              getEventStatus={getEventStatus}
              onSeeAll={handleShowExplore}
              emptyText="No upcoming events found."
              emptyActionText="Explore Events"
              onCreateEvent={() => router.push('/screens/Explore')}
              fadeAnim={fadeAnim}
              translateY={translateY}
              getItemAnimationValues={getItemAnimationValues}
            />
          </View>

          {/* Nearby Events Section */}
          <View style={styles.sectionContainer}>
            <EventSection
              title="Events Near You"
              events={nearbyEvents}
              loading={loading}
              attendingEvents={attendingEvents}
              getEventStatus={getEventStatus}
              onSeeAll={handleShowExplore}
              emptyText="No nearby events found."
              fadeAnim={fadeAnim}
              translateY={translateY}
              getItemAnimationValues={getItemAnimationValues}
            />
          </View>

          {/* My Events Section - only shown if user is logged in */}
          {user && (
            <View style={styles.sectionContainer}>
              <EventSection
                title="Events You're Hosting"
                events={myEvents}
                loading={loading}
                attendingEvents={attendingEvents}
                getEventStatus={getEventStatus}
                onSeeAll={() => router.push('/screens/event-history')}
                emptyText="You haven't created any events yet."
                emptyActionText="Create Event"
                onCreateEvent={() => router.push('/screens/Create')}
                fadeAnim={fadeAnim}
                translateY={translateY}
                getItemAnimationValues={getItemAnimationValues}
              />
            </View>
          )}
        </View>

        {/* Debug Section - Only shown when DEBUG_COMPONENTS feature flag is enabled */}
        {isEnabled('DEBUG_COMPONENTS') && (
          <>
            <EventDebug events={events} title="All Events Debug" />
            <EventDebug events={upcomingEvents} title="Upcoming Events Debug" />
            <EventDebug events={nearbyEvents} title="Nearby Events Debug" />
            {user && <EventDebug events={myEvents} title="My Events Debug" />}
          </>
        )}
          </>
        )}
        keyExtractor={() => 'home-content'}
      />

      {/* Floating Action Button for Event Creation */}
      <TouchableOpacity
        style={styles.createEventFAB}
        onPress={() => router.push('/screens/Create')}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Create new event"
        accessibilityRole="button"
        accessibilityHint="Opens event creation screen"
      >
        <LinearGradient
          colors={['#007AFF', '#4F46E5']} // Use hardcoded colors for LinearGradient
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  ), [
    isOffline, refreshing, handleRefresh, colorScheme, user, loading, error,
    featuredEvent, upcomingEvents, nearbyEvents, myEvents, attendingEvents,
    handleShowExplore, handleSelectCategory, retryLoading, getDaysUntil,
    getEventStatus, fadeAnim, translateY, getItemAnimationValues, isEnabled, events
  ]);

  return (
    <>
      {renderContent}
      
      {/* Explore Events Modal */}
      <ExploreModal
        visible={showExploreModal}
        events={filteredEvents}
        searchQuery={searchQuery}
        selectedFilter={selectedFilter}
        selectedCategory={selectedCategory}
        getEventStatus={getEventStatus}
        onClose={handleHideExplore}
        onReset={resetFilters}
        onSearchChange={setSearchQuery}
        onFilterChange={setSelectedFilter}
        onCategoryChange={setSelectedCategory}
        translateY={exploreModalTranslateY}
        loading={loading}
      />
    </>
  );
}
// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  // Main containers
  pageContainer: {
    flex: 1,
    backgroundColor: '#121212', // Darker background for better contrast with cards
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  
  // Header section
  headerContainer: {
    backgroundColor: '#007AFF',
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...cardShadow,
    elevation: 8, // Add elevation for Android
    marginBottom: 10, // Add margin to separate from content
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitleText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...buttonShadow,
  },
  scanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...buttonShadow,
  },
  
  // Discovery section (search & categories)
  discoverySection: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#1E1E1E', // Slightly lighter background for better visibility
    borderRadius: 20,
    padding: 20,
    ...cardShadow,
    elevation: 5, // Add elevation for Android
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Add subtle border
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2D2D2D',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exploreButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  categoriesContainer: {
    // No additional styling needed as CategoryButtons has its own internal padding
  },
  
  // Status containers (loading/error)
  statusContainer: {
    margin: 16,
    padding: 28,
    backgroundColor: '#1E1E1E', // Slightly lighter background for better visibility
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
    elevation: 4, // Add elevation for Android
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // More visible border
  },
  statusText: {
    fontSize: 18,
    color: '#CCCCCC',
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    ...buttonShadow,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Section containers
  sectionContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#1E1E1E', // Slightly lighter background for better visibility
    borderRadius: 20,
    overflow: 'hidden',
    ...cardShadow,
    elevation: 4, // Add elevation for Android
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // More visible border
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionContent: {
    padding: 18,
  },
  eventsSectionsContainer: {
    marginBottom: 16,
  },
  
  // Offline banner
  offlineBanner: {
    backgroundColor: '#6B7280',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
  },
  
  // FAB
  createEventFAB: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    ...buttonShadow,
    borderRadius: 30,
    elevation: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  }
});