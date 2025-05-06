// app/components/profile/ProfileHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow } from '../../utils/platformUtils';

interface ProfileHeaderProps {
  onSettingsPress: () => void;
}

/**
 * Profile header component
 * Displays the header with title and settings button
 * Enhanced with transparent background and modern styling
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onSettingsPress }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.header, 
        { paddingTop: Math.max(insets.top, 20) }
      ]}
      testID="profile-header"
    >
      <Text style={styles.headerTitle}>Profile</Text>
      
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettingsPress}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        accessibilityLabel="Settings"
        accessibilityRole="button"
        testID="settings-button"
      >
        <FontAwesome name="cog" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'transparent', // Removed white background
    borderBottomWidth: 0, // Removed border
    zIndex: 999, // Added zIndex to ensure header stays on top
  },
  headerTitle: {
    fontSize: 26, // Increased from 20
    fontWeight: '700', 
    color: '#FFFFFF', // Changed to white
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  settingsButton: {
    width: 44, // Slightly larger
    height: 44, // Slightly larger
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});

export default ProfileHeader;