import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import { useColorScheme } from 'react-native';
import { createShadow } from '../utils/platformUtils';
import ScreenLayout from '../components/common/ScreenLayout';
import ScreenWrapper from '../components/common/ScreenWrapper';
import SearchBar from '../components/common/SearchBar';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import components from home directory
import {
  EventCard,
  FeaturedEvent,
  EventSection,
  ExploreModal,
  useEventData,
  useAnimations
} from '../components/home';
// Import EVENT_CATEGORIES but we won't use it in the UI
import { EVENT_CATEGORIES } from '../components/home/CategoryButtons';
import { getEventColor } from '../components/home/utils/uiHelpers';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// SkeletonLoader component for loading states
const SkeletonLoader = ({ 
  width, 
  height, 
  style, 
  borderRadius = 8 
}: { 
  width?: number | string; 
  height?: number | string; 
  style?: any; 
  borderRadius?: number 
}) => {
  const animatedValue = new RNAnimated.Value(0);
  
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        RNAnimated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0.03)', 'rgba(0, 0, 0, 0.15)'],
  });
  
  return (
    <RNAnimated.View
      style={[
        {
          width: width || '100%',
          height: height || 20,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// SkeletonEventCard component
const SkeletonEventCard = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <View style={[styles.skeletonCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
      <SkeletonLoader height={120} borderRadius={12} style={{}} />
      <View style={styles.skeletonCardContent}>
        <SkeletonLoader width={150} height={24} style={{ marginBottom: 12 }} />
        <SkeletonLoader width={100} height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={180} height={16} style={{ marginBottom: 16 }} />
        <View style={styles.skeletonFooter}>
          <SkeletonLoader width={80} height={24} borderRadius={12} style={{}} />
          <SkeletonLoader width={40} height={40} borderRadius={20} style={{}} />
        </View>
      </View>
    </View>
  );
};

/**
 * Home screen component with styling consistent with the feed screen
 * Category buttons have been removed as requested
 */
export default function Home() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Define tab bar height - ideally this would come from a shared constant
  const TAB_BAR_HEIGHT = 60;
  
  // Dynamic theme based on color scheme
  const THEME = {
    // Base colors
    background: isDarkMode ? '#121212' : '#F9FAFB',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    
    // Gradients
    primaryGradientStart: '#2563EB',
    primaryGradientEnd: '#4F46E5',
    
    // Text colors
    text: isDarkMode ? '#F3F4F6' : '#1F2937',
    secondaryText: isDarkMode ? '#9CA3AF' : '#6B7280',
    accentText: '#4F46E5', // Keep accent the same for brand consistency
    
    // UI elements
    border: isDarkMode ? '#2D2D2D' : '#E5E7EB',
    divider: isDarkMode ? '#262626' : '#F3F4F6',
    
    // Status colors remain the same
    success: '#10B981',
    warning: '#FBBF24',
    error: '#EF4444',
  };
  
  // Animated values
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const animationProgress = useRef(new RNAnimated.Value(0)).current;
  const rotateAnim = useRef(new RNAnimated.Value(0)).current;
  
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
  const [pulseAnim] = useState(new RNAnimated.Value(1));
  
  // Start pulse animation
  useEffect(() => {
    // Rotation animation for loading icon
    RNAnimated.loop(
      RNAnimated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
    
    // Pulse animation for action buttons
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Initial appearance animation with a subtle delay sequence
    const timer = setTimeout(() => {
      RNAnimated.timing(animationProgress, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }).start();
      
      // Staggered animations for list items
      setTimeout(() => {
        animateListItems(events.length);
      }, 600);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [animateListItems, events.length]);
  
  // Handle category selection (now used only in explore modal)
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
  
  // Animation interpolations
  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Calculate the top area height with proper component measurements and safe area insets
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 130 : 110;
  const SEARCH_HEIGHT = 60;
  // Use actual safe area insets instead of hardcoded values
  const topAreaHeight = HEADER_HEIGHT + SEARCH_HEIGHT - 15;
  
  // Glowing dot pulse for notification indicator
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [0.7, 1],
    extrapolate: 'clamp',
  });
  
  // Create header right content
  const headerRightContent = (
    <>
      <TouchableOpacity
        style={styles.headerButtonContainer}
        onPress={() => router.push('/screens/NearbyEventsScreen')}
      >
        <BlurView 
          intensity={30} 
          tint="light" 
          style={styles.headerButtonBlur}
        >
          <MaterialIcons name="map" size={22} color="#FFF" />
        </BlurView>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.headerButtonContainer}
        onPress={() => router.push('/screens/notifications')}
      >
        <BlurView 
          intensity={30} 
          tint="light" 
          style={styles.headerButtonBlur}
        >
          <FontAwesome name="bell" size={22} color="#FFF" />
          <RNAnimated.View 
            style={[
              styles.notificationDot,
              { 
                opacity: glowOpacity,
                transform: [{ scale: pulseAnim }],
              }
            ]} 
          />
        </BlurView>
      </TouchableOpacity>
    </>
  );

return (
    <ScreenWrapper
      backgroundColor={THEME.background}
      statusBarStyle={isDarkMode ? "light-content" : "dark-content"}
      header={{
        title: user?.name ? `Hello ${user.name.split(' ')[0]}` : 'Hello',
        subtitle: 'Discover exciting events near you',
        rightContent: headerRightContent,
        gradientColors: [THEME.primaryGradientStart, THEME.primaryGradientEnd]
      }}
      withSearchBar={true}
      searchBarContent={
        <View style={{ paddingTop: 18, paddingHorizontal: 0 }}>
          <SearchBar
            placeholder="Explore all events"
            value=""
            editable={false}
            onPress={() => router.push('/screens/explore')}
          />
          <View style={{
            height: 0.5,
            backgroundColor: 'rgba(0,0,0,0.05)',
            marginTop: 10
          }} />
        </View>
      }
      contentContainerStyle={{ flex: 1 }}
    >
      {/* Main Content */}
      <RNAnimated.FlatList
        data={[]}
        renderItem={null}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20, // Add tab bar height plus buffer
          paddingHorizontal: 16,
        }}
        ListHeaderComponent={
          <>
            {/* Loading State - Using skeleton loaders */}
            {loading && (
              <>
                <View style={[styles.sectionContainer, { backgroundColor: THEME.card }]}>
                  <View style={[styles.sectionHeader, { borderBottomColor: THEME.border }]}>
                    <SkeletonLoader width={150} height={24} style={{}} />
                    <SkeletonLoader width={80} height={20} style={{}} />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContent}
                  >
                    {[1, 2, 3].map((_, index) => (
                      <View key={`skeleton-${index}`} style={{ marginRight: 16 }}>
                        <SkeletonEventCard isDarkMode={isDarkMode} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={[styles.sectionContainer, { backgroundColor: THEME.card }]}>
                  <View style={[styles.sectionHeader, { borderBottomColor: THEME.border }]}>
                    <SkeletonLoader width={150} height={24} style={{}} />
                    <SkeletonLoader width={80} height={20} style={{}} />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContent}
                  >
                    {[1, 2, 3].map((_, index) => (
                      <View key={`skeleton-nearby-${index}`} style={{ marginRight: 16 }}>
                        <SkeletonEventCard isDarkMode={isDarkMode} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
            
            {/* Error State */}
            {error && !loading && (
              <View style={[styles.errorContainer, { 
                backgroundColor: THEME.card,
                borderColor: 'rgba(239, 68, 68, 0.2)'
              }]}>
                <View style={styles.errorIconContainer}>
                  <MaterialIcons name="error-outline" size={48} color={THEME.error} />
                </View>
                <Text style={[styles.errorText, { color: THEME.error }]}>
                  Connection Interrupted
                </Text>
                <Text style={[styles.errorSubtext, { color: THEME.secondaryText }]}>
                  {error.message || "Unable to reach event servers. Check your connection."}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  activeOpacity={0.8}
                  onPress={retryLoading}
                >
                  <Text style={styles.retryButtonText}>Reconnect</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Featured Event */}
            {!loading && featuredEvent && (
              <RNAnimated.View 
                style={[
                  styles.featuredEventContainer,
                  {
                    opacity: animationProgress.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0, 0, 1]
                    }),
                    transform: [{ 
                      translateY: animationProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }
                ]}
              >
                <FeaturedEvent
                  event={featuredEvent}
                  daysUntil={getDaysUntil(featuredEvent.date)}
                  fadeAnim={fadeAnim}
                  translateY={translateY}
                  theme={THEME}
                />
              </RNAnimated.View>
            )}

            {/* Upcoming Events Section */}
            {!loading && upcomingEvents && upcomingEvents.length > 0 && (
              <RNAnimated.View
                style={[
                  styles.sectionContainer,
                  {
                    backgroundColor: THEME.card,
                    opacity: animationProgress.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0, 1]
                    }),
                    transform: [{
                      translateY: animationProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.sectionHeader, { borderBottomColor: THEME.border }]}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color={THEME.accentText}
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: THEME.text }]}>
                      Upcoming Events
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.seeAllButton, { backgroundColor: `${THEME.accentText}20` }]}
                    onPress={() => router.push('/screens/UpcomingEventsScreen')}
                  >
                    <Text style={[styles.seeAllText, { color: THEME.accentText }]}>
                      See All
                    </Text>
                    <MaterialIcons name="arrow-forward-ios" size={12} color={THEME.accentText} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {upcomingEvents.map((event, index) => (
                    <EventCard
                      key={`upcoming-${event.id}`}
                      event={event}
                      theme={THEME}
                      onPress={() => router.push({
                        pathname: '/screens/eventdetails',
                        params: { id: event.id.toString() }
                      })}
                      style={{ marginRight: index < upcomingEvents.length - 1 ? 16 : 0 }}
                      animationDelay={index * 100}
                      getEventStatus={getEventStatus}
                      isUserAttending={isUserAttending}
                    />
                  ))}
                </ScrollView>
              </RNAnimated.View>
            )}

            {/* Your Events Section */}
            {!loading && myEvents && myEvents.length > 0 && (
              <RNAnimated.View
                style={[
                  styles.sectionContainer,
                  {
                    backgroundColor: THEME.card,
                    opacity: animationProgress.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0, 0, 1]
                    }),
                    transform: [{
                      translateY: animationProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.sectionHeader, { borderBottomColor: THEME.border }]}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons
                      name="star-outline"
                      size={22}
                      color={THEME.accentText}
                      style={styles.sectionIcon}
                    />
                    <Text style={[styles.sectionTitle, { color: THEME.text }]}>
                      Your Events
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.seeAllButton, { backgroundColor: `${THEME.accentText}20` }]}
                    onPress={() => router.push('/screens/MyEventsScreen')}
                  >
                    <Text style={[styles.seeAllText, { color: THEME.accentText }]}>
                      See All
                    </Text>
                    <MaterialIcons name="arrow-forward-ios" size={12} color={THEME.accentText} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {myEvents.map((event, index) => (
                    <EventCard
                      key={`my-event-${event.id}`}
                      event={event}
                      theme={THEME}
                      onPress={() => router.push({
                        pathname: '/screens/eventdetails',
                        params: { id: event.id.toString() }
                      })}
                      style={{ marginRight: index < myEvents.length - 1 ? 16 : 0 }}
                      animationDelay={index * 100}
                      getEventStatus={getEventStatus}
                      isUserAttending={isUserAttending}
                    />
                  ))}
                </ScrollView>
              </RNAnimated.View>
            )}
          </>
        }
        keyExtractor={() => 'home-content'}
        ListEmptyComponent={null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEvents}
            colors={[THEME.primaryGradientEnd]}
            tintColor={THEME.accentText}
            progressViewOffset={topAreaHeight + insets.top}
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
        futuristicTheme={THEME as any}
      />

      {/* Floating Action Button - positioned above tab bar */}
      <RNAnimated.View style={[
        styles.fabContainer,
        {
          transform: [{ scale: pulseAnim }],
          bottom: TAB_BAR_HEIGHT + insets.bottom,
        }
      ]}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => router.push('/screens/Create')}
        >
          <LinearGradient
            colors={[THEME.primaryGradientStart, THEME.primaryGradientEnd]}
            style={styles.fabGradient}
          >
            <MaterialIcons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </RNAnimated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Header
  headerButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 20,
    borderRadius: 16,
    ...createShadow(1),
  },
  loadingIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  // Error State
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    ...createShadow(1),
  },
  errorIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    ...createShadow(1),
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Featured Event
  featuredEventContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow(2),
  },
  
  // Section Containers
  sectionContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow(1),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  
  // Empty State
  emptyContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 14,
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    ...createShadow(2),
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    right: 25,
    zIndex: 10,
    ...createShadow(3),
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Skeleton Loading Styles
  skeletonCard: {
    width: SCREEN_WIDTH * 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    ...createShadow(1),
  },
  skeletonCardContent: {
    padding: 16,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
