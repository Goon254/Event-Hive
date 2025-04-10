// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Text,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import * as ImagePicker from 'expo-image-picker';

// Custom hooks
import { useProfile } from '../hooks/useProfile';

// Components
import {
  ProfileHeader,
  ProfileCard,
  StatsCard,
  MenuList,
  LogoutButton,
  VersionInfo,
  MenuItem,
} from '../components/profile';

/**
 * Profile Screen
 * Main screen for user profile and account settings
 */
export default function ProfileScreen() {
  const { user, signOut, error, clearError, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Use the profile hook to fetch and manage profile data
  const {
    profile,
    isLoading: profileLoading,
    isImageUploading,
    fetchProfile,
    uploadProfileImage,
  } = useProfile(user?.id);

  // Combined loading state
  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    // Start animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Set status bar for better visibility
    StatusBar.setBarStyle('dark-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditImage = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to set a profile picture.'
        );
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        
        // Upload the image
        await uploadProfileImage(selectedImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Define menu items
  const menuItems: MenuItem[] = [
    {
      icon: 'user',
      title: 'Personal Information',
      description: 'Update your profile details',
      onPress: () => router.push('/screens/personal-information'),
    },
    {
      icon: 'credit-card',
      title: 'Payment Methods',
      description: 'Manage your payment options',
      onPress: () => router.push('/screens/payment-methods'),
    },
    {
      icon: 'history',
      title: 'Event History',
      description: 'View your past events',
      onPress: () => router.push('/screens/event-history'),
    },
    {
      icon: 'bell',
      title: 'Notifications',
      description: 'Manage your alerts and reminders',
      onPress: () => router.push('/screens/notifications'),
      badge: 3, // Example notification count
    },
    {
      icon: 'shield',
      title: 'Privacy & Security',
      description: 'Control your account security settings',
      onPress: () => router.push('/screens/privacy'),
    },
    {
      icon: 'gear',
      title: 'Settings',
      description: 'Customize app preferences',
      onPress: () => router.push('/screens/settings'),
    },
    {
      icon: 'question-circle',
      title: 'Help & Support',
      description: 'Get assistance and FAQs',
      onPress: () => router.push('/screens/help'),
    },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!user) {
    return null; // Redirect to login if user is not authenticated
  }

  // If profile is not loaded yet but user is authenticated, show a placeholder
  if (!profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="profile-screen">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <ProfileHeader 
        onSettingsPress={() => router.push('/screens/settings')} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <ProfileCard 
          profile={profile}
          isImageLoading={isImageUploading}
          onEditProfilePress={() => router.push('/screens/personal-information')}
          onEditImagePress={handleEditImage}
        />
        
        {/* Stats Summary */}
        <StatsCard stats={profile.stats} />

        {/* Menu Items */}
        <MenuList 
          items={menuItems} 
          fadeAnim={fadeAnim}
          isLoading={isLoading}
        />

        {/* Logout Button */}
        <LogoutButton 
          onPress={handleLogout}
          isLoading={isLoading}
        />
        
        {/* App Version */}
        <VersionInfo version="1.0.0" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});