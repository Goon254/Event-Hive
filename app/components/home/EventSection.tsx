import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Event } from '../../services/eventServices';
// Colors and theme hook imports unused here; removing to fix resolution errors
import EventCard from './EventCard';
import { createShadow } from './utils/uiHelpers';

interface EventSectionProps {
  title: string;
  events: Event[];
  loading: boolean;
  attendingEvents: string[];
  getEventStatus: (event: Event) => string;
  onSeeAll?: () => void;
  onCreateEvent?: () => void;
  emptyText: string;
  emptyActionText?: string;
  fadeAnim: Animated.Value;
  translateY: Animated.Value;
  getItemAnimationValues: (index: number) => { fadeValue: Animated.Value, translateValue: Animated.Value };
}

/**
 * EventSection component - displays a section of events with a title and horizontal scrolling list
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const EventSection = ({
  title,
  events,
  loading,
  attendingEvents,
  getEventStatus,
  onSeeAll,
  onCreateEvent,
  emptyText,
  emptyActionText,
  fadeAnim,
  translateY,
  getItemAnimationValues
}: EventSectionProps) => {
  const { width } = Dimensions.get('window');
  const CARD_WIDTH = width * 0.75;
  
  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      {/* Background image for consistent design aesthetic */}
      <Image
        source={require('../../../assets/images/tropical-gradient.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>
        {events.length > 0 && onSeeAll && (
          <TouchableOpacity 
            onPress={onSeeAll}
            style={styles.seeAllButton}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={`See all ${title}`}
            accessibilityRole="button"
            accessibilityHint={`View all ${title.toLowerCase()}`}
          >
            <Text style={styles.seeAllText}>
              See All
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color="#007AFF"
              style={{marginLeft: 4}} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sectionContent}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="large"
              color="#007AFF"
            />
            <Text style={styles.loaderText}>Loading events...</Text>
          </View>
        ) : events && events.length > 0 ? (
          <View style={styles.eventsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 16}
              accessible={true}
              accessibilityLabel={`${title} events list`}
              accessibilityHint="Scroll horizontally to view more events"
            >
              {events.slice(0, 5).map((item, index) => {
                const { fadeValue, translateValue } = getItemAnimationValues(index);
                console.log(`Rendering event card for ${item.title}`);
                return (
                  <EventCard
                    key={item.id || `event-${index}`}
                    event={item}
                    theme={{
                      primaryGradientStart: '#00BFA6',
                      primaryGradientEnd: '#00A19D',
                      secondaryText: '#6B7280',
                      accentText: '#111827',
                      text: '#111827',
                      card: '#FFFFFF',
                    }}
                    onPress={() => router.push({ pathname: '/screens/eventdetails', params: { id: item.id } })}
                    getEventStatus={(e) => ({ label: getEventStatus(e) })}
                    isUserAttending={(id) => attendingEvents.includes(id)}
                    style={{ width: CARD_WIDTH, marginRight: 16 }}
                  />
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {emptyText}
            </Text>
            {onCreateEvent && emptyActionText && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={onCreateEvent}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={emptyActionText}
                accessibilityRole="button"
              >
                <FontAwesome name="plus" size={14} color="#FFF" style={{marginRight: 8}} />
                <Text style={styles.createButtonText}>{emptyActionText}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  // Section container with proper styling
  sectionContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E', // Darker background for better contrast with cards
    elevation: 3, // Add elevation for Android
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // More visible border
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.08,
    zIndex: 0,
  },
  
  // Section header with subtle divider
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.3)', // More visible background
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  
  // Section content container
  sectionContent: {
    padding: 16,
    paddingBottom: 24,
  },
  eventsContainer: {
    minHeight: 200, // Ensure there's space for events
    marginBottom: 8, // Add some bottom margin
    paddingVertical: 4, // Add some vertical padding
  },
  
  // List styling
  horizontalList: {
    paddingRight: 16,
    paddingVertical: 4, // Add some vertical padding
    flexDirection: 'row', // Ensure horizontal layout
    alignItems: 'flex-start', // Align items at the top
  },
  
  // Loader styling
  loaderContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker background to make loader more visible
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#a9a9a9',
  },
  
  // Empty state styling
  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A', // Lighter background for better visibility
    minHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Even more visible border
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    color: '#CCCCCC',
  },
  
  // Action button styling
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...buttonShadow,
    elevation: 4, // Add elevation for Android
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(EventSection);