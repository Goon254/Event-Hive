// app/(tabs)/Home.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Device from 'expo-device';
import { router, usePathname } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions,
  ImageBackground,
  StatusBar,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView, BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import ScreenWrapper from '../components/common/ScreenWrapper';
import SearchBar from '../components/common/SearchBar';
import FloatingActionButton from '../components/common/FloatingActionButton';
import { EventCard, useEventData, useAnimations } from '../components/home';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Event as EventType } from '../services/eventServices';

// Define EventStatus interface locally
interface EventStatus {
  label: string;
  color?: string;
  backgroundColor?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


const PREMIUM_GRADIENT = {
  light: ['#00BFA6', '#00A19D'],
  dark: ['#00CFAD', '#008F8B']
};

// Type guard to check if user has premium status
interface PremiumUser extends Record<string, any> {
  isPremium: boolean;
}

function hasPremium(user: any): user is PremiumUser {
  return user && typeof user.isPremium === 'boolean';
}

export default function Home() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  // Check if BlurView is supported on this device
  const [isBlurSupported, setIsBlurSupported] = useState(true);
  
  useEffect(() => {
    // On Android, BlurView might not be supported on all devices
    // We'll check the device and OS to determine if we should use a fallback
    const checkBlurSupport = async () => {
      if (Platform.OS === 'android') {
        const deviceInfo = await Device.getDeviceTypeAsync();
        const osVersion = Platform.Version;
        
        // This is a simplified check - in a real app, you might want to check
        // specific device models or Android API levels
        if (deviceInfo === Device.DeviceType.PHONE && osVersion < 23) {
          setIsBlurSupported(false);
        }
      }
    };
    
    checkBlurSupport();
  }, []);

  const TAB_BAR_HEIGHT = 60;

  const THEME = {
    background: isDarkMode ? '#121212' : '#F7F9FC',
    card: isDarkMode ? 'rgba(45, 45, 45, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDarkMode ? '#F0FDF4' : '#1F2937',
    secondaryText: isDarkMode ? '#9CA3AF' : '#6B7280',
    accentText: '#00BFA6',
    primaryGradientStart: isDarkMode ? PREMIUM_GRADIENT.dark[0] : PREMIUM_GRADIENT.light[0],
    primaryGradientEnd: isDarkMode ? PREMIUM_GRADIENT.dark[1] : PREMIUM_GRADIENT.light[1],
    cardGlassEffect: true,
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const animationProgress = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const {
    upcomingEvents,
    featuredEvent, // Single featured event
    nearbyEvents, // New addition - nearby events
    loading,
    refreshing,
    error,
    searchQuery,
    selectedFilter,
    selectedCategory,
    filteredEvents,
    refreshEvents,
    retryLoading,
    getEventStatus,
    isUserAttending,
    setSearchQuery,
    setSelectedFilter,
    setSelectedCategory,
  } = useEventData(user?.id);

  // Create a featuredEvents array from the single featuredEvent for compatibility
  const featuredEvents = featuredEvent ? [featuredEvent] : [];

  const {
    fadeAnim,
    animateListItems,
  } = useAnimations();

  const [activeSection, setActiveSection] = useState('all'); // 'all', 'featured', 'nearby'
  
  // Wrapper function to convert FilterType to EventStatus
  const getEventStatusWrapper = useCallback((event: EventType): EventStatus => {
    const status = getEventStatus(event);
    // Convert FilterType to EventStatus
    switch(status) {
      case 'upcoming':
        return { label: 'Upcoming', color: '#00BFA6', backgroundColor: '#00BFA620' };
      case 'ongoing':
        return { label: 'Ongoing', color: '#F59E0B', backgroundColor: '#F59E0B20' };
      case 'completed':
        return { label: 'Completed', color: '#6B7280', backgroundColor: '#6B728020' };
      default:
        return { label: 'All', color: '#6B7280', backgroundColor: '#6B728020' };
    }
  }, [getEventStatus]);
  

  // Track if screen is focused using Expo Router
  const pathname = usePathname();
  const isFocused = pathname === '/' || pathname === '/Home' || pathname === '/(tabs)/Home';

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start();
      animateListItems(upcomingEvents.length);
      
    }, 300);
    return () => clearTimeout(timer);
  }, [animateListItems, upcomingEvents.length]);

  const handleOpenExploreScreen = () => {
    router.push('/screens/explore');
  };


  // Animated header with scroll effect
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Get events based on selected section
  const getDisplayedEvents = () => {
    switch(activeSection) {
      case 'featured':
        return featuredEvents || [];
      case 'nearby':
        return nearbyEvents || [];
      default:
        return upcomingEvents || [];
    }
  };

  const renderSectionTabs = () => (
    <View style={styles.sectionTabsContainer}>
      <Pressable 
        style={[styles.sectionTab, activeSection === 'all' && styles.sectionTabActive]} 
        onPress={() => setActiveSection('all')}
      >
        <Text style={[
          styles.sectionTabText, 
          activeSection === 'all' ? { color: THEME.primaryGradientStart } : { color: THEME.secondaryText }
        ]}>All Events</Text>
      </Pressable>
      
      <Pressable 
        style={[styles.sectionTab, activeSection === 'featured' && styles.sectionTabActive]} 
        onPress={() => setActiveSection('featured')}
      >
        <Text style={[
          styles.sectionTabText, 
          activeSection === 'featured' ? { color: THEME.primaryGradientStart } : { color: THEME.secondaryText }
        ]}>Featured</Text>
      </Pressable>
      
      <Pressable 
        style={[styles.sectionTab, activeSection === 'nearby' && styles.sectionTabActive]} 
        onPress={() => setActiveSection('nearby')}
      >
        <Text style={[
          styles.sectionTabText, 
          activeSection === 'nearby' ? { color: THEME.primaryGradientStart } : { color: THEME.secondaryText }
        ]}>Nearby</Text>
      </Pressable>
    </View>
  );

  const renderHeader = () => (
    <Animated.View style={[
      styles.headerAnimatedContainer,
      {
        transform: [
          { translateY: headerTranslateY },
          { scale: headerScale }
        ],
        opacity: headerOpacity,
      }
    ]}>
      {/* Weather Widget - New Premium Feature */}
      {user && hasPremium(user) && user.isPremium && (
        <View style={styles.weatherWidget}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
            style={styles.weatherGradient}
          >
            <Ionicons name="partly-sunny" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.weatherText}>82°F • Perfect for outdoor events</Text>
          </LinearGradient>
        </View>
      )}
      
      {/* App Title and Enhanced Profile Section */}
      <View style={styles.headerContainer}>
        <Animated.Text style={[styles.headerTitle]}>
          Event<Text style={styles.headerTitleHive}>Hive</Text>
        </Animated.Text>
        
        {user && (
          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.profileButtonGradient}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.profileInitials}>{user.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
              
              {/* Premium badge if user is premium */}
              {user && hasPremium(user) && user.isPremium && (
                <View style={styles.premiumBadge}>
                  <MaterialCommunityIcons name="star" size={10} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Welcome Message - New Feature */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          {getWelcomeMessage()}, {user?.name?.split(' ')[0] || 'Explorer'}
        </Text>
        <Text style={styles.welcomeSubtext}>
          Discover amazing experiences around you
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Explore all events"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onPress={handleOpenExploreScreen}
          premium={true}
        />
      </View>

      {/* Section Tabs */}
      {renderSectionTabs()}
    </Animated.View>
  );

  // Welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScreenWrapper
      header={{ hidden: true }}
      backgroundColor="transparent"
      statusBarStyle="light-content"
      contentContainerStyle={{ flex: 1 }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ImageBackground
        source={require('../../assets/images/tropical-gradient.png')} // Update with your premium background
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
          style={styles.backgroundOverlay}
        />

        {renderHeader()}

        {/* Event List */}
        <FlatList
          data={getDisplayedEvents()}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: animationProgress.interpolate({ 
                  inputRange: [0, 0.3 + index * 0.1, 1], 
                  outputRange: [0, 0, 1] 
                }),
                transform: [{ 
                  translateY: animationProgress.interpolate({ 
                    inputRange: [0, 1], 
                    outputRange: [30, 0] 
                  }) 
                }],
              }}
            >
              <EventCard
                event={item}
                theme={THEME}
                getEventStatus={getEventStatusWrapper}
                isUserAttending={isUserAttending}
                style={{ marginBottom: 16 }}
              />
            </Animated.View>
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ 
            paddingHorizontal: 24,
            paddingTop: 340, // Adjust based on header height
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40
          }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={refreshEvents} 
              colors={[THEME.accentText]}
              progressBackgroundColor={isDarkMode ? '#2D2D2D' : '#FFFFFF'}
              tintColor="#FFFFFF"
              progressViewOffset={340} // Match paddingTop
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyStateText}>No events found</Text>
              <Text style={styles.emptyStateSubtext}>Try changing filters or create your first event</Text>
            </View>
          )}
        />

        {/* Create Event FAB removed - we now use the Create tab instead */}
      </ImageBackground>

      {/* We've removed the Explore Modal and now use the explore screen instead */}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backgroundOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  headerAnimatedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    zIndex: 10,
  },
  weatherWidget: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weatherText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTitleHive: {
    color: '#00BFA6',
    fontWeight: '800',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  welcomeContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
  },
  sectionTabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // FAB styles are now handled in the component
});