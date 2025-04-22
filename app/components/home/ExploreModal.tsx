import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Event } from '../../services/eventServices';
import { FilterType } from './hooks/useEventData';
import { EVENT_CATEGORIES } from './CategoryButtons';
import { getEventColor, getStatusColor } from './utils/uiHelpers';
import { formatDate } from '../../utils/dateUtils';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExploreModalProps {
  visible: boolean;
  events: Event[];
  searchQuery: string;
  selectedFilter: FilterType;
  selectedCategory: string | null;
  getEventStatus: (event: Event) => string;
  onClose: () => void;
  onReset: () => void;
  onSearchChange: (text: string) => void;
  onFilterChange: (filter: FilterType) => void;
  onCategoryChange: (category: string | null) => void;
  translateY: Animated.Value;
  loading: boolean;
  futuristicTheme: any;
}

/**
 * Enhanced Explore Modal with futuristic glass morphism design
 */
const ExploreModal = ({
  visible,
  events,
  searchQuery,
  selectedFilter,
  selectedCategory,
  getEventStatus,
  onClose,
  onReset,
  onSearchChange,
  onFilterChange,
  onCategoryChange,
  translateY,
  loading,
  futuristicTheme
}: ExploreModalProps) => {
  // Animation values
  const filterScrollAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  
  // Start animations when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 300,
      }).start();
      
      Animated.timing(filterScrollAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        delay: 500,
      }).start();
    } else {
      // Reset animations when modal is hidden
      searchAnim.setValue(0);
      filterScrollAnim.setValue(0);
    }
  }, [visible, searchAnim, filterScrollAnim]);
  
  // Filter types
  const filters: { id: FilterType | string; label: string }[] = [
    { id: 'all', label: 'All Events' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
  ];
  
  // Animation interpolations
  const modalScale = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });
  
  const modalOpacity = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  
  const searchTranslateX = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });
  
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const filterScrollTranslateY = filterScrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  
  const filterScrollOpacity = filterScrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  // Render an event item
  const renderEventItem = ({ item, index }: { item: Event; index: number }) => {
    const isAttending = false; // This would be determined by context in a real app
    const status = getEventStatus(item);
    
    return (
      <Animated.View
        style={{
          opacity: visible ? 1 : 0,
          transform: [
            { 
              translateY: visible ? 
                new Animated.Value(0) : 
                new Animated.Value(20 * (index % 3))
            }
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            onClose();
            router.push(`/screens/eventdetails?id=${item.id}`);
          }}
          style={styles.eventItem}
          accessible={true}
          accessibilityLabel={`${item.title} event on ${formatDate(item.date)}`}
          accessibilityRole="button"
          accessibilityHint="Opens event details"
        >
          <BlurView intensity={30} tint="dark" style={styles.eventItemBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
              style={styles.eventItemGradient}
            >
              {/* Event Category Tag */}
              <View style={[
                styles.categoryTag,
                { backgroundColor: getCategoryColor(item.category || '') }
              ]}>
                <Text style={styles.categoryTagText}>
                  {item.category || 'Event'}
                </Text>
              </View>
              
              {/* Event Title */}
              <Text style={styles.eventTitle}>{item.title}</Text>
              
              {/* Event Details */}
              <View style={styles.eventDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="calendar-today" size={14} color={futuristicTheme.textSecondary} />
                  <Text style={styles.detailText}>{formatDate(item.date)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={14} color={futuristicTheme.textSecondary} />
                  <Text style={styles.detailText}>{item.location || 'Location TBD'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <FontAwesome name="user" size={14} color={futuristicTheme.textSecondary} />
                  <Text style={styles.detailText}>
                    {`${item.attendees?.length || 0} attending`}
                  </Text>
                </View>
              </View>
              
              {/* Status Badge */}
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: 
                    status === 'upcoming' ? 'rgba(16, 185, 129, 0.2)' :
                    status === 'ongoing' ? 'rgba(251, 191, 36, 0.2)' :
                                          'rgba(255, 255, 255, 0.1)'
                }
              ]}>
                <View style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      status === 'upcoming' ? futuristicTheme.success :
                      status === 'ongoing' ? futuristicTheme.warning :
                                            'rgba(255, 255, 255, 0.5)'
                  }
                ]} />
                <Text style={[
                  styles.statusText,
                  {
                    color:
                      status === 'upcoming' ? futuristicTheme.success :
                      status === 'ongoing' ? futuristicTheme.warning :
                                            'rgba(255, 255, 255, 0.5)'
                  }
                ]}>
                  {status === 'upcoming' ? 'Upcoming' : 
                   status === 'ongoing' ? 'Live Now' : 'Past'}
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Helper function to get color for category
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'Music': '#F87171',
      'Sports': '#10B981',
      'Business': '#4F46E5',
      'Tech': '#0EA5E9',
      'Food': '#FB923C',
      'Health': '#EC4899',
      'Arts': '#8B5CF6',
    };
    
    return categoryColors[category] || '#6366F1';
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: modalOpacity,
            transform: [{ scale: modalScale }],
          }
        ]}
      >
        <BlurView
          intensity={90}
          tint="dark"
          style={styles.blurContainer}
        >
          {/* Modal Header with Close Button */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Close explore modal"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color={futuristicTheme.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Discover Events</Text>
            
            <TouchableOpacity
              style={styles.resetButton}
              onPress={onReset}
              accessible={true}
              accessibilityLabel="Reset filters"
              accessibilityRole="button"
              accessibilityHint="Clear all search filters"
            >
              <MaterialIcons name="refresh" size={22} color={futuristicTheme.textAccent} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Input with Animation */}
          <Animated.View
            style={[
              styles.searchContainer,
              {
                opacity: searchOpacity,
                transform: [{ translateX: searchTranslateX }],
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.searchGradient}
            >
              <MaterialIcons name="search" size={22} color={futuristicTheme.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor={futuristicTheme.textSecondary}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Search events"
                accessibilityHint="Enter text to search events by title or location"
              />
              {searchQuery ? (
                <TouchableOpacity 
                  onPress={() => onSearchChange('')}
                  accessible={true}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="clear" size={18} color={futuristicTheme.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </LinearGradient>
          </Animated.View>
          
          {/* Filter Tabs with Animation */}
          <Animated.View
            style={[
              styles.filtersContainer,
              {
                opacity: filterScrollOpacity,
                transform: [{ translateY: filterScrollTranslateY }],
              }
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScrollContent}
              accessible={true}
              accessibilityLabel="Event status filters"
              accessibilityHint="Scroll horizontally to view all filter options"
            >
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.id && styles.filterButtonActive
                  ]}
                  onPress={() => onFilterChange(filter.id as FilterType)}
                  accessible={true}
                  accessibilityLabel={`${filter.label} filter`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedFilter === filter.id }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === filter.id && styles.filterButtonTextActive
                    ]}
                  >
                    {filter.label}
                  </Text>
                  
                  {selectedFilter === filter.id && (
                    <LinearGradient
                      colors={futuristicTheme.accentGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterActiveIndicator}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
          
          {/* Categories with Animation */}
          <Animated.View
            style={[
              styles.categoriesContainer,
              {
                opacity: filterScrollOpacity,
                transform: [{ translateY: filterScrollTranslateY }],
              }
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
              accessible={true}
              accessibilityLabel="Event categories"
              accessibilityHint="Scroll horizontally to view all categories"
            >
              {EVENT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive
                  ]}
                  onPress={() => onCategoryChange(
                    selectedCategory === category.id ? null : category.id
                  )}
                  accessible={true}
                  accessibilityLabel={`${category.name} category`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCategory === category.id }}
                >
                  <LinearGradient
                    colors={
                      selectedCategory === category.id
                        ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                        : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                    }
                    style={styles.categoryButtonGradient}
                  >
                    <FontAwesome
                      name={category.icon as any}
                      size={16}
                      color={
                        selectedCategory === category.id
                          ? futuristicTheme.textPrimary
                          : futuristicTheme.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === category.id && styles.categoryButtonTextActive
                      ]}
                    >
                      {category.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
          
          {/* Event List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Animated.View
                style={{
                  transform: [
                    { 
                      rotate: new Animated.Value(0).interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }
                  ]
                }}
              >
                <MaterialIcons name="refresh" size={36} color={futuristicTheme.textAccent} />
              </Animated.View>
              <Text style={styles.loadingText}>Finding events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color={futuristicTheme.textSecondary} />
              <Text style={styles.emptyText}>No events found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters or search terms
              </Text>
              <TouchableOpacity
                style={styles.resetAllButton}
                onPress={onReset}
                accessible={true}
                accessibilityLabel="Reset all filters"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={futuristicTheme.accentGradient}
                  style={styles.resetAllGradient}
                >
                  <Text style={styles.resetAllText}>Reset All Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={events}
              renderItem={renderEventItem}
              keyExtractor={(item, index) => `explore-${item.id || index}`}
              contentContainerStyle={styles.eventsList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              numColumns={1}
              accessible={true}
              accessibilityLabel="Filtered events list"
              accessibilityHint="Scroll to view all filtered events"
            />
          )}
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

// Enhanced styles for the ExploreModal
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 11, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  resetText: {
    color: '#A78BFA',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filtersContainer: {
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  filtersScrollContent: {
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  categoriesScrollContent: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryButtonActive: {
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  categoryButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  eventItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventItemBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventItemGradient: {
    padding: 16,
    position: 'relative',
  },
  categoryTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  categoryTagText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginRight: 80, // Leave space for the category tag
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  resetAllButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  resetAllGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  resetAllText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// Use React.memo to prevent unnecessary re-renders
export default memo(ExploreModal);