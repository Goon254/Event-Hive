// app/components/profile/MenuList.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
 * With enhanced glassmorphism styling and animations
 */
const MenuList: React.FC<MenuListProps> = ({ 
  items, 
  fadeAnim,
  isLoading = false
}) => {
  // Track which item is being pressed for animation
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const handlePressIn = (index: number) => {
    setPressedIndex(index);
  };

  const handlePressOut = () => {
    setPressedIndex(null);
  };

  // Get gradient colors for icon background
  const getIconGradientColors = (icon: string): [string, string] => {
    const gradients = {
      'user': ['#6366F1', '#4F46E5'],
      'gear': ['#34D399', '#10B981'],
      'bell': ['#FBBF24', '#F59E0B'],
      'shield': ['#F87171', '#EF4444'],
      'question-circle': ['#A78BFA', '#8B5CF6'],
      'credit-card': ['#60A5FA', '#3B82F6'],
      'history': ['#F472B6', '#EC4899'],
    };
    return (gradients[icon as keyof typeof gradients] || ['#9CA3AF', '#6B7280']) as [string, string];
  };

  return (
    <View style={styles.container} testID="menu-list">
      <Text style={styles.sectionTitle}>Account Settings</Text>
      <BlurView intensity={25} tint="light" style={styles.blurContainer}>
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
                  index === items.length - 1 && styles.menuItemLast,
                  pressedIndex === index && styles.menuItemPressed
                ]}
                onPress={item.onPress}
                onPressIn={() => handlePressIn(index)}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
                disabled={isLoading}
                accessibilityLabel={item.title}
                testID={`menu-item-${index}`}
              >
                <View style={styles.menuItemContent}>
                  <LinearGradient
                    colors={getIconGradientColors(item.icon)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                  >
                    <FontAwesome name={item.icon} size={18} color="white" />
                  </LinearGradient>
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
                  <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </BlurView>
    </View>
  );
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
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...cardShadow,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243, 244, 246, 0.5)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    transform: [{ scale: 0.99 }],
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
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
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