import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Modal,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Event } from '../../services/eventServices';
import { FilterType } from './hooks/useEventData';
import { EVENT_CATEGORIES } from './CategoryButtons';
import { getEventColor, getStatusColor, createShadow } from './utils/uiHelpers';
import { formatDate } from '../../utils/dateUtils';

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
}

/**
 * ExploreModal component - displays a modal for exploring and filtering events
 * Optimized with React.memo to prevent unnecessary re-renders
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
  loading
}: ExploreModalProps) => {
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.exploreModalContainer,
            {
              transform: [{ translateY }]
            }
          ]}
        >
          {/* Modal Header */}
          <View style={styles.exploreHeader}>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Close explore modal"
              accessibilityRole="button"
            >
              <FontAwesome name="times" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.exploreTitle}>Explore Events</Text>
            <TouchableOpacity 
              onPress={onReset}
              style={styles.resetButton}
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Reset filters"
              accessibilityRole="button"
              accessibilityHint="Clear all search filters"
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.exploreSearchContainer}>
            <FontAwesome name="search" size={18} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.exploreSearchInput}
              placeholder="Search events by title or location"
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholderTextColor="#9CA3AF"
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Search events"
              accessibilityHint="Enter text to search events by title or location"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => onSearchChange('')}
                // Add accessibility props
                accessible={true}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
              >
                <FontAwesome name="times-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Filter Tabs */}
          <View style={styles.exploreFilterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Event status filters"
              accessibilityHint="Scroll horizontally to view all filter options"
            >
              {['all', 'upcoming', 'ongoing', 'completed'].map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.exploreFilterButton,
                    selectedFilter === filter && styles.exploreFilterButtonActive,
                  ]}
                  onPress={() => onFilterChange(filter as FilterType)}
                  // Add accessibility props
                  accessible={true}
                  accessibilityLabel={`${filter} events filter`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedFilter === filter }}
                >
                  <Text
                    style={[
                      styles.exploreFilterButtonText,
                      selectedFilter === filter && styles.exploreFilterButtonTextActive,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Category Chips */}
          <View style={styles.exploreCategoriesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Event categories"
              accessibilityHint="Scroll horizontally to view all categories"
            >
              {EVENT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.exploreCategoryChip,
                    selectedCategory === category.id && styles.exploreCategoryChipSelected
                  ]}
                  onPress={() => onCategoryChange(
                    selectedCategory === category.id ? null : category.id
                  )}
                  // Add accessibility props
                  accessible={true}
                  accessibilityLabel={`${category.name} category`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCategory === category.id }}
                >
                  <FontAwesome 
                    name={category.icon as any} 
                    size={16} 
                    color={selectedCategory === category.id ? "#FFFFFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.exploreCategoryChipText,
                    selectedCategory === category.id && styles.exploreCategoryChipTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Event List */}
          {loading ? (
            <View style={styles.exploreLoadingContainer}>
              <MaterialIcons name="hourglass-empty" size={48} color="#D1D5DB" />
              <Text style={styles.exploreLoadingText}>Loading events...</Text>
            </View>
          ) : (
            <FlatList
              data={events}
              renderItem={({ item }) => {
                const status = getEventStatus(item);
                const statusColors = getStatusColor(status);
                
                return (
                  <TouchableOpacity
                    style={styles.exploreEventCard}
                    onPress={() => {
                      onClose();
                      router.push(`/screens/eventdetails?id=${item.id}`);
                    }}
                    // Add accessibility props
                    accessible={true}
                    accessibilityLabel={`${item.title} event on ${formatDate(item.date)}`}
                    accessibilityRole="button"
                    accessibilityHint="Opens event details"
                  >
                    <View style={styles.exploreEventImageContainer}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.exploreEventImage} />
                      ) : (
                        <View style={[
                          styles.exploreEventImagePlaceholder,
                          { backgroundColor: getEventColor(item.title) }
                        ]}>
                          <Text style={styles.exploreEventImageText}>
                            {item.title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.exploreEventContent}>
                      <Text style={styles.exploreEventTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      
                      <View style={styles.exploreEventInfo}>
                        <View style={styles.exploreInfoRow}>
                          <FontAwesome name="calendar" size={14} color="#6B7280" />
                          <Text style={styles.exploreEventDetails}>
                            {formatDate(item.date)}
                          </Text>
                        </View>
                        
                        <View style={styles.exploreInfoRow}>
                          <FontAwesome name="map-marker" size={14} color="#6B7280" />
                          <Text style={styles.exploreEventDetails} numberOfLines={1}>
                            {item.location || "Location TBD"}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Status Badge */}
                      <View style={[
                        styles.exploreStatusBadge,
                        { backgroundColor: statusColors.bg }
                      ]}>
                        <Text style={[
                          styles.exploreStatusText,
                          { color: statusColors.text }
                        ]}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.exploreEventList}
              ListEmptyComponent={
                <View style={styles.exploreEmptyContainer}>
                  <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
                  <Text style={styles.exploreEmptyText}>No events found</Text>
                  <Text style={styles.exploreEmptySubtext}>
                    {searchQuery ? 'Try adjusting your search or filters' : 'No events match your current filters'}
                  </Text>
                </View>
              }
              // Performance optimizations
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews={true}
              // Add accessibility props
              accessible={true}
              accessibilityLabel="Filtered events list"
              accessibilityHint="Scroll to view all filtered events"
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  exploreModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...cardShadow,
  },
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  exploreSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  exploreSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  exploreFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exploreFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  exploreFilterButtonActive: {
    backgroundColor: '#007AFF',
  },
  exploreFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  exploreFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  exploreCategoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exploreCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  exploreCategoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  exploreCategoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  exploreCategoryChipTextSelected: {
    color: '#FFFFFF',
  },
  exploreEventList: {
    padding: 16,
    paddingBottom: 120,
  },
  exploreEventCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  exploreEventImageContainer: {
    width: 100,
    height: 100,
  },
  exploreEventImage: {
    width: '100%',
    height: '100%',
  },
  exploreEventImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreEventImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  exploreEventContent: {
    flex: 1,
    padding: 12,
    position: 'relative',
  },
  exploreEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  exploreEventInfo: {
    flex: 1,
  },
  exploreInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exploreEventDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  exploreStatusBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exploreStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exploreLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  exploreLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  exploreEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  exploreEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  exploreEmptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(ExploreModal);