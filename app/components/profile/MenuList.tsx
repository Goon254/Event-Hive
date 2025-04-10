// app/components/profile/MenuList.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { createShadow } from '../../utils/platformUtils';

export type FontAwesomeIconName = 
  'user' | 
  'gear' | 
  'bell' | 
  'shield' | 
  'question-circle' | 
  'credit-card' | 
  'history';

export interface MenuItem {
  icon: FontAwesomeIconName;
  title: string;
  description?: string;
  onPress: () => void;
  badge?: number | null;
}

interface MenuListProps {
  items: MenuItem[];
  fadeAnim: Animated.Value;
  isLoading?: boolean;
}

/**
 * Menu list component
 * Displays a list of menu items with icons and descriptions
 */
const MenuList: React.FC<MenuListProps> = ({ 
  items, 
  fadeAnim,
  isLoading = false
}) => {
  return (
    <View style={styles.container} testID="menu-list">
      <Text style={styles.sectionTitle}>Account Settings</Text>
      <View style={styles.menuContainer}>
        {items.map((item, index) => (
          <Animated.View 
            key={index} 
            style={{ 
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }}
          >
            <TouchableOpacity
              style={[
                styles.menuItem,
                index === items.length - 1 && styles.menuItemLast
              ]}
              onPress={item.onPress}
              disabled={isLoading}
              accessibilityLabel={item.title}
              testID={`menu-item-${index}`}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor(item.icon) }]}>
                  <FontAwesome name={item.icon} size={18} color="white" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.menuRightContainer}>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// Helper function to get a consistent color for each icon
const getIconBackgroundColor = (icon: string) => {
  const colors = {
    'user': '#4F46E5',
    'gear': '#10B981',
    'bell': '#F59E0B',
    'shield': '#EF4444',
    'question-circle': '#8B5CF6',
    'credit-card': '#3B82F6',
    'history': '#EC4899',
  };
  return colors[icon as keyof typeof colors] || '#6B7280';
};

// Platform-specific shadows
const cardShadow = createShadow(3);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
    marginLeft: 16,
    marginBottom: 8,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    ...cardShadow,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  menuRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 14,
    textAlign: 'center',
  },
});

export default MenuList;