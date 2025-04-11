import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Event } from '../../services/eventServices';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
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
  const colorScheme = useColorScheme();
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
              size="small"
              color="#007AFF"
            />
          </View>
        ) : events.length > 0 ? (
          <FlatList
            data={events.slice(0, 5)}
            renderItem={({ item, index }) => {
              const { fadeValue, translateValue } = getItemAnimationValues(index);
              return (
                <EventCard
                  item={item}
                  index={index}
                  isAttending={attendingEvents.includes(item.id)}
                  status={getEventStatus(item)}
                  fadeValue={fadeValue}
                  translateValue={translateValue}
                />
              );
            }}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={true}
            accessible={true}
            accessibilityLabel={`${title} events list`}
            accessibilityHint="Scroll horizontally to view more events"
          />
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
    backgroundColor: '#1E1E1E',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  
  // Section content container
  sectionContent: {
    padding: 16,
    paddingBottom: 20,
  },
  
  // List styling
  horizontalList: {
    paddingRight: 16,
  },
  
  // Loader styling
  loaderContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty state styling
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    minHeight: 120,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    color: '#A9A9A9',
  },
  
  // Action button styling
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
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(EventSection);