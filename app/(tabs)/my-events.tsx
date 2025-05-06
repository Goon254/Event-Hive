// app/(tabs)/my-events.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Pressable,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { Event as EventType } from '../services/eventServices';
import { createShadow } from '../utils/platformUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import EventCard from '../components/home/EventCard';
import FloatingActionButton from '../components/common/FloatingActionButton';
import ScreenWrapper from '../components/common/ScreenWrapper';
import SearchBar from '../components/common/SearchBar';
import { useEventData } from '../components/home';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tab types for main navigation
type TabType = 'created' | 'attending';

// Define theme for event cards - consistent with Home.tsx
const THEME = {
  primaryGradientStart: '#F97316', // Orange
  primaryGradientEnd: '#FB923C',   // Light orange
  secondaryText: '#6B7280',        // Gray
  accentText: '#F97316',           // Orange
  text: '#1F2937',                 // Dark gray
  card: '#FFFFFF',                 // White
  cardGlassEffect: true,           // Enable glass effect
};

export default function MyEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Use the same hook as Home.tsx for data fetching
  const {
    myEvents,
    loading,
    refreshing,
    searchQuery,
    filteredEvents,
    refreshEvents,
    getEventStatus,
    isUserAttending,
    setSearchQuery,
  } = useEventData(user?.id);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const animationProgress = useRef(new Animated.Value(0)).current;
  
  // Track active tab
  const [selectedTab, setSelectedTab] = useState<TabType>('created');
  
  // Start animations when component mounts
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(animationProgress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
    
    return () => {
      // Reset animation values on unmount
      fadeAnim.setValue(0);
      scrollY.setValue(0);
      animationProgress.setValue(0);
    };
  }, [fadeAnim, animationProgress]);
  
  // Convert event status to format expected by EventCard
  const getEventCardStatus = useCallback((event: EventType) => {
    const status = getEventStatus(event);
    
    switch(status) {
      case 'upcoming':
        return {
          label: 'Upcoming',
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8'
        };
      case 'ongoing':
        return {
          label: 'Live Now',
          backgroundColor: '#ECFDF5',
          color: '#047857'
        };
      case 'completed':
        return {
          label: 'Past',
          backgroundColor: '#F3F4F6',
          color: '#6B7280'
        };
      default:
        return {
          label: 'Unknown',
          backgroundColor: '#F3F4F6',
          color: '#6B7280'
        };
    }
  }, [getEventStatus]);

  // Navigate to event details
  const navigateToEventDetails = useCallback((eventId: string) => {
    router.push(`/screens/eventdetails?id=${eventId}`);
  }, [router]);
  
  // Navigate to edit event
  const navigateToEditEvent = useCallback((eventId: string) => {
    router.push(`/screens/edit-event?id=${eventId}`);
  }, [router]);
  
  // Navigate to create event
  const navigateToCreateEvent = useCallback(() => {
    router.push('/screens/create');
  }, [router]);
  
  // Handle tab selection
  const handleTabSelect = useCallback((tab: TabType) => {
    setSelectedTab(tab);
  }, []);
  
  // Animate each card with fade-in and slide-up effect
  const renderEventCard = useCallback(({ item, index }: { item: EventType, index: number }) => {
    return (
      <Animated.View
        style={{
          opacity: animationProgress.interpolate({
            inputRange: [0, 0.3 + index * 0.1, 1],
            outputRange: [0, 0, 1]
          }),
          transform: [
            {
              translateY: animationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }
          ],
          marginBottom: 16,
        }}
      >
        <EventCard
          event={item}
          theme={THEME}
          getEventStatus={() => getEventCardStatus(item)}
          isUserAttending={isUserAttending}
          onPress={() => navigateToEventDetails(item.id)}
          style={styles.eventCardContainer}
        />
        
        {/* Action buttons for edit functionality */}
        {selectedTab === 'created' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigateToEditEvent(item.id)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  }, [animationProgress, selectedTab, navigateToEventDetails, navigateToEditEvent, getEventCardStatus, isUserAttending]);
  
  // Render empty state with suggestions
  const renderEmptyState = useCallback(() => {
    let message = `You don't have any events.`;
    let suggestion = '';
    let icon = <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />;
    
    if (searchQuery) {
      message = `No events match "${searchQuery}"`;
      suggestion = 'Try a different search term or clear the search.';
      icon = <Feather name="search" size={64} color="#D1D5DB" />;
    } else if (selectedTab === 'created') {
      suggestion = 'Create a new event to get started!';
    } else {
      suggestion = 'Join some events to see them here!';
    }
    
    return (
      <View style={styles.emptyContainer}>
        {icon}
        <Text style={styles.emptyText}>{message}</Text>
        <Text style={styles.emptySubtext}>{suggestion}</Text>
        
        {selectedTab === 'created' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={navigateToCreateEvent}
          >
            <Feather name="plus" size={16} color="#FFFFFF" style={{marginRight: 8}} />
            <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [searchQuery, selectedTab, navigateToCreateEvent]);

  // Handle scroll events for header animation
  const handleScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  ), [scrollY]);
  
  // Render header with search bar and tabs
  const renderHeader = useCallback(() => (
    <Animated.View style={{ paddingTop: insets.top + 20, paddingBottom: 16, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>My Events</Text>

      <View style={{ marginBottom: 12 }}>
        <SearchBar
          placeholder="Search your events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          premium={true}
        />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {['created', 'attending'].map(tab => (
          <Pressable
            key={tab}
            onPress={() => handleTabSelect(tab as TabType)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: selectedTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}
          >
            <Text style={{
              fontWeight: '600',
              color: selectedTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.7)'
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  ), [selectedTab, insets.top, searchQuery, setSearchQuery, handleTabSelect]);

  // Calculate the bottom padding to avoid overlapping with the tab bar
  const tabBarHeight = 60 + insets.bottom;

  return (
    <ScreenWrapper
      header={{ hidden: true }}
      backgroundColor="transparent"
      statusBarStyle="light-content"
      contentContainerStyle={{ flex: 1 }}
    >
      <ImageBackground
        source={require('../../assets/images/tropical-gradient.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
          style={styles.backgroundOverlay}
        />
        
        {/* Events list */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Loading your events...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={(item: EventType) => item.id.toString()}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: tabBarHeight + 80, // Add extra padding to avoid overlap with FAB
              paddingHorizontal: 24,
            }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshEvents}
                colors={['#F97316']}
                tintColor="#F97316"
                progressViewOffset={140}
              />
            }
          />
        )}
        
        {/* Floating Action Button - Positioned above tab bar */}
        <View style={[styles.fabContainer, { bottom: tabBarHeight + 20 }]}>
          <FloatingActionButton
            onPress={navigateToCreateEvent}
            icon="add"
            colors={['#F97316', '#FB923C']}
            size={52}
            iconSize={24}
          />
        </View>
      </ImageBackground>
    </ScreenWrapper>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    margin: 16,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  eventCardContainer: {
    width: '100%',
    borderRadius: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
    paddingRight: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    ...cardShadow,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  editButton: {
    backgroundColor: '#F97316',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    margin: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...buttonShadow,
    marginTop: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
});