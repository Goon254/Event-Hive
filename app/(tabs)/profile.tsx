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
import { enhancedImageService, ImageType, ImageQuality, ImageSize } from '../services/enhancedImageService';

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
  
  // Use the profile hook to manage profile data
  const {
    isLoading: profileLoading,
    isImageUploading,
    uploadProfileImage,
  } = useProfile(user?.id);
  
  // For this example, we'll use a placeholder profile
  const [profile, setProfile] = useState<any>(null);
  
  // Fetch profile data when component mounts
  useEffect(() => {
    if (user?.id) {
      // In a real implementation, this would fetch the profile from a service
      setProfile({
        id: user.id,
        name: user.name || 'User',
        email: user.email || '',
        profileImageUrl: user.avatar,
        stats: {
          eventsAttended: 0,
          eventsCreated: 0,
          connections: 0
        }
      });
    }
  }, [user]);

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
      // Use the enhanced image service to pick an image
      const selectedImageUri = await enhancedImageService.pickImage({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (selectedImageUri) {
        // Configure upload options
        const uploadOptions = {
          quality: ImageQuality.HIGH,
          maxWidth: ImageSize.MEDIUM,
          maxHeight: ImageSize.MEDIUM,
          compress: true,
          generateThumbnail: true,
          thumbnailSize: 150,
          metadata: {
            updatedAt: new Date().toISOString(),
            source: 'profile-screen'
          }
        };
        
        // If we're using the existing profile service, we can pass the URI directly
        // Otherwise, we can use the enhanced service directly
        if (typeof uploadProfileImage === 'function') {
          // Use the existing profile service (which will be updated later)
          await uploadProfileImage(selectedImageUri);
        } else {
          // Use the enhanced service directly
          await enhancedImageService.uploadProfileImage(selectedImageUri, uploadOptions);
          // Refresh profile to show the new image
          await fetchProfile();
        }
      }
    } catch (error) {
      console.error('Error picking or uploading image:', error);
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    }
  };
  
  // Function to refresh profile data
  const fetchProfile = async () => {
    if (user?.id) {
      // In a real implementation, this would fetch the profile from a service
      // For now, we'll just update the profile with the user's avatar
      setProfile((prev: any) => ({
        ...prev,
        profileImageUrl: user.avatar
      }));
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