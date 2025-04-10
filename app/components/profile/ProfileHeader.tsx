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
        <FontAwesome name="cog" size={22} color="#1F2937" />
      </TouchableOpacity>
    </View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(3);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#1F2937',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});

export default ProfileHeader;