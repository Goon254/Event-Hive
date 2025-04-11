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
      
      <ScrollView
        style={styles.scrollView}
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
  // Main containers
  pageContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  
  // Header section
  headerContainer: {
    backgroundColor: '#007AFF',
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    ...cardShadow,
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
  
  // Discovery section (search & categories)
  discoverySection: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2D2D2D',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  exploreButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  categoriesContainer: {
    // No additional styling needed as CategoryButtons has its own internal padding
  },
  
  // Status containers (loading/error)
  statusContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  statusText: {
    fontSize: 16,
    color: '#a9a9a9',
    marginTop: 12,
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
  
  // Section containers
  sectionContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionContent: {
    padding: 16,
  },
  eventsSectionsContainer: {
    marginBottom: 16,
  },
  
  // Offline banner
  offlineBanner: {
    backgroundColor: '#6B7280',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  
  // FAB
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