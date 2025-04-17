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
  ImageBackground,
  Modal,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
 * ExploreModal component - visually enhanced version
 * Displays a modal for exploring and filtering events with a modern image-focused design
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
  
  // Generate status colors based on status
  const getStatusBgColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'upcoming':
        return '#3B82F6'; // Blue
      case 'ongoing': 
        return '#10B981'; // Green
      case 'completed':
        return '#6B7280'; // Gray
      default:
        return '#8B5CF6'; // Purple
    }
  };
  
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
              accessible={true}
              accessibilityLabel="Close explore modal"
              accessibilityRole="button"
            >
              <FontAwesome name="times" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.exploreTitle}>Explore Events</Text>
            <TouchableOpacity 
              onPress={onReset}
              style={styles.resetButton}
              accessible={true}
              accessibilityLabel="Reset filters"
              accessibilityRole="button"
              accessibilityHint="Clear all search filters"
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Section */}
          <View style={styles.searchSection}>
            {/* Search Bar */}
            <View style={styles.exploreSearchContainer}>
              <FontAwesome name="search" size={18} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.exploreSearchInput}
                placeholder="Search events by title or location"
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholderTextColor="#9CA3AF"
                accessible={true}
                accessibilityLabel="Search events"
                accessibilityHint="Enter text to search events by title or location"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => onSearchChange('')}
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
              <Text style={styles.filterSectionTitle}>Status</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
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
                      selectedFilter === filter && {
                        backgroundColor: filter === 'upcoming' ? '#3B82F6' : 
                                        filter === 'ongoing' ? '#10B981' : 
                                        filter === 'completed' ? '#6B7280' : '#8B5CF6'
                      }
                    ]}
                    onPress={() => onFilterChange(filter as FilterType)}
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
              <Text style={styles.filterSectionTitle}>Categories</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
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
          </View>
          
          {/* Results Section */}
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>
              Results {!loading && `(${events.length})`}
            </Text>
            
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
                  const statusBgColor = getStatusBgColor(status);
                  
                  return (
                    <TouchableOpacity
                      style={styles.exploreEventCard}
                      onPress={() => {
                        onClose();
                        router.push(`/screens/eventdetails?id=${item.id}`);
                      }}
                      accessible={true}
                      accessibilityLabel={`${item.title} event on ${formatDate(item.date)}`}
                      accessibilityRole="button"
                      accessibilityHint="Opens event details"
                    >
                      {/* Event image or color placeholder */}
                      <ImageBackground
                        source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                        style={[
                          styles.eventImageBackground,
                          !item.imageUrl && { backgroundColor: getEventColor(item.title) }
                        ]}
                        imageStyle={styles.eventImageStyle}
                      >
                        {/* Display letter if no image */}
                        {!item.imageUrl && (
                          <Text style={styles.eventImageLetter}>
                            {item.title.charAt(0).toUpperCase()}
                          </Text>
                        )}
                        
                        {/* Status badge */}
                        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                        </View>
                      </ImageBackground>
                      
                      {/* Event details */}
                      <View style={styles.eventDetailsContainer}>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        
                        <View style={styles.eventMetaRow}>
                          <FontAwesome name="calendar" size={14} color="#007AFF" />
                          <Text style={styles.eventMetaText}>
                            {formatDate(item.date)}
                          </Text>
                        </View>
                        
                        <View style={styles.eventMetaRow}>
                          <FontAwesome name="map-marker" size={14} color="#007AFF" />
                          <Text style={styles.eventMetaText} numberOfLines={1}>
                            {item.location || "Location TBD"}
                          </Text>
                        </View>
                        
                        {item.isPaid && (
                          <View style={styles.priceBadge}>
                            <FontAwesome name="ticket" size={12} color="#FFF" />
                            <Text style={styles.priceText}>
                              ${item.price?.toFixed(2) || '0.00'}
                            </Text>
                          </View>
                        )}
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
                accessible={true}
                accessibilityLabel="Filtered events list"
                accessibilityHint="Scroll to view all filtered events"
              />
            )}
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  exploreModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E1E1E',
  },
  closeButton: {
    padding: 8,
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Search section
  searchSection: {
    backgroundColor: '#1E1E1E',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exploreSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  exploreSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Filter sections
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  exploreFilterContainer: {
    paddingBottom: 16,
  },
  exploreFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginLeft: 16,
    borderRadius: 20,
    backgroundColor: '#2D2D2D',
  },
  exploreFilterButtonActive: {
    backgroundColor: '#007AFF',
  },
  exploreFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A0A0A0',
  },
  exploreFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  exploreCategoriesContainer: {
    paddingBottom: 16,
  },
  exploreCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginLeft: 16,
    borderRadius: 20,
    backgroundColor: '#2D2D2D',
  },
  exploreCategoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  exploreCategoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A0A0A0',
    marginLeft: 6,
  },
  exploreCategoryChipTextSelected: {
    color: '#FFFFFF',
  },
  
  // Results section
  resultsSection: {
    flex: 1,
    backgroundColor: '#121212',
  },
  resultsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exploreEventList: {
    padding: 16,
    paddingBottom: 120,
  },
  
  // Enhanced event card
  exploreEventCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    ...cardShadow,
    elevation: 5,
  },
  eventImageBackground: {
    height: 140,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImageStyle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  eventImageLetter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    ...Platform.select({
      ios: { zIndex: 1 }
    }),
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eventDetailsContainer: {
    padding: 16,
    backgroundColor: '#1E1E1E',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventMetaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#A0A0A0',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue with opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priceText: {
    color: '#60A5FA', // Light blue
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Loading and empty states
  exploreLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  exploreLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#A0A0A0',
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
    color: '#FFFFFF',
    marginTop: 16,
  },
  exploreEmptySubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(ExploreModal);