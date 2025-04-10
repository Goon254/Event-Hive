// app/components/connections/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  scrollY: Animated.Value;
  pendingCount: number;
  onSettingsPress: () => void;
}

/**
 * Header component for connections screen
 * Includes title, pending badge, and settings button
 */
const Header: React.FC<HeaderProps> = ({ scrollY, pendingCount, onSettingsPress }) => {
  const insets = useSafeAreaInsets();
  
  // Animation for header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.8, 0.6],
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View 
      style={[
        styles.header,
        { 
          paddingTop: Math.max(insets.top, 40), 
          opacity: headerOpacity 
        }
      ]}
      testID="connections-header"
    >
      <Text style={styles.headerTitle}>Your Network</Text>
      
      {pendingCount > 0 && (
        <TouchableOpacity 
          style={styles.pendingBadge}
          accessibilityLabel={`${pendingCount} pending connections`}
          accessibilityRole="button"
          testID="pending-badge"
        >
          <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettingsPress}
        accessibilityLabel="Settings"
        accessibilityRole="button"
        testID="settings-button"
      >
        <Ionicons name="settings-outline" size={24} color="#1F2937" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#1F2937',
  },
  pendingBadge: {
    position: 'absolute',
    right: 50,
    top: Platform.OS === 'ios' ? 48 : 28,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 48 : 28,
  },
});

export default Header;