import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { createShadow } from '../../utils/platformUtils';

// Import custom hooks
import { useAnimations } from './hooks/useAnimations';
import { useEventData, FilterType } from './hooks/useEventData';

// Import components
import FeaturedEvent from './FeaturedEvent';
import CategoryButtons from './CategoryButtons';
import EventSection from './EventSection';
import ExploreModal from './ExploreModal';

/**
 * HomeScreen component - main screen of the app
 * Refactored for better performance and maintainability
 */
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [showExploreModal, setShowExploreModal] = useState(false);
  
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
  
  // Handle showing explore modal
  const handleShowExplore = useCallback(() => {
    setShowExploreModal(true);
    animateShowModal();
  }, [animateShowModal]);
  
  // Handle hiding explore modal
  const handleHideExplore = useCallback(() => {
    animateHideModal(() => {
      setShowExploreModal(false);
    });
  }, [animateHideModal]);
  
  // Handle category selection
  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    handleShowExplore();
  }, [setSelectedCategory, handleShowExplore]);
  
  // Show error alert
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

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineBannerText}>
            You are offline. Some content may be unavailable.
          </Text>
        </View>
      )}
      
      <ScrollView
        style={[styles.container, { backgroundColor: '#000000' }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEvents}
            colors={[Colors[colorScheme ?? 'light'].tint]}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        // Add accessibility props
        accessible={true}
        accessibilityLabel="Home screen content"
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
              style={styles.mapButton}
              onPress={() => router.push('/screens/NearbyEventsScreen')}
              activeOpacity={0.7}
              // Add accessibility props
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
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Scan QR code"
              accessibilityRole="button"
              accessibilityHint="Opens QR code scanner"
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
          // Add accessibility props
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

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <View style={[styles.errorContainer, { backgroundColor: '#1E1E1E' }]}>
            <MaterialIcons name="error-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Unable to load events</Text>
            <Text style={styles.errorSubtext}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={[styles.loadingContainer, { backgroundColor: '#1E1E1E' }]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { color: '#a9a9a9' }]}>Loading events...</Text>
          </View>
        )}

        
        {/* Featured Event */}
        {!loading && featuredEvent && (
          <View style={styles.sectionWrapper}>
            <FeaturedEvent
              event={featuredEvent}
              daysUntil={getDaysUntil(featuredEvent.date)}
              fadeAnim={fadeAnim}
              translateY={translateY}
            />
          </View>
        )}

        {/* Upcoming Events Section */}
        <View style={styles.sectionWrapper}>
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
        <View style={styles.sectionWrapper}>
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
          <View style={styles.sectionWrapper}>
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
      </ScrollView>

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

      {/* Floating Action Button for Event Creation */}
      <TouchableOpacity 
        style={styles.createEventFAB}
        onPress={() => router.push('/screens/Create')}
        activeOpacity={0.8}
        // Add accessibility props
        accessible={true}
        accessibilityLabel="Create new event"
        accessibilityRole="button"
        accessibilityHint="Opens event creation screen"
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
  categoriesContainer: {
    paddingVertical: 10,
  },
  sectionWrapper: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#a9a9a9',
    marginTop: 12,
  },
  offlineBanner: {
    backgroundColor: '#6B7280',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#a9a9a9',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
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
    zIndex: 10, // Ensure header is above other content
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
    gap: 10,
  },
  mapButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
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
    marginTop: -20, // Position it to overlap with the header
    marginBottom: 10,
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
  createEventFAB: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...buttonShadow,
    borderRadius: 28,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  }
});