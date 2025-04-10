import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getEventColor, createShadow } from './utils/uiHelpers';

// Categories for events
export const EVENT_CATEGORIES = [
  { id: 'music', name: 'Music', icon: 'music' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'tech', name: 'Technology', icon: 'laptop' },
  { id: 'sports', name: 'Sports', icon: 'futbol-o' },
  { id: 'food', name: 'Food', icon: 'cutlery' },
  { id: 'arts', name: 'Arts', icon: 'paint-brush' },
  { id: 'education', name: 'Education', icon: 'graduation-cap' },
  { id: 'health', name: 'Health', icon: 'heartbeat' }
];

interface CategoryButtonsProps {
  onSelectCategory: (categoryId: string) => void;
  fadeAnim: Animated.Value;
  translateY: Animated.Value;
}

/**
 * CategoryButtons component - displays scrollable category buttons
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const CategoryButtons = ({
  onSelectCategory,
  fadeAnim,
  translateY
}: CategoryButtonsProps) => {
  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }]
      }}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        // Add accessibility props
        accessible={true}
        accessibilityLabel="Event categories"
        accessibilityHint="Scroll horizontally to view all categories"
      >
        {EVENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryButton}
            onPress={() => onSelectCategory(category.id)}
            // Add accessibility props
            accessible={true}
            accessibilityLabel={`${category.name} category`}
            accessibilityRole="button"
            accessibilityHint={`Filter events by ${category.name} category`}
          >
            <View style={[styles.categoryIcon, { backgroundColor: getEventColor(category.name) }]}>
              <FontAwesome name={category.icon as any} size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

// Platform-specific shadows
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...buttonShadow,
  },
  categoryText: {
    fontSize: 12,
    color: '#4B5563',
  }
});

// Use React.memo to prevent unnecessary re-renders
export default memo(CategoryButtons);