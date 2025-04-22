// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import { COLORS } from '../theme/constants';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text,
  Animated,
  StatusBar,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenLayout from '../components/common/ScreenLayout';
import ScreenWrapper from '../components/common/ScreenWrapper';
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

  // Create header right content
  const headerRightContent = (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => router.push('/screens/settings')}
    >
      <MaterialIcons name="settings" size={22} color="#FFF" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScreenWrapper
        backgroundColor={COLORS.background}
        statusBarStyle="light-content"
        header={{
          title: 'Profile',
          subtitle: 'Manage your account',
          gradientColors: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd]
        }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!user) {
    return null; // Redirect to login if user is not authenticated
  }

  // If profile is not loaded yet but user is authenticated, show a placeholder
  if (!profile) {
    return (
      <ScreenWrapper
        backgroundColor={COLORS.background}
        statusBarStyle="light-content"
        header={{
          title: 'Profile',
          subtitle: 'Manage your account',
          gradientColors: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd]
        }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      backgroundColor={COLORS.background}
      statusBarStyle="light-content"
      header={{
        title: 'Profile',
        subtitle: 'Manage your account',
        rightContent: headerRightContent,
        gradientColors: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd]
      }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Profile Card with dark theme */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {profile.profileImageUrl ? (
              <Image
                source={{ uri: profile.profileImageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editImageButton}
              onPress={handleEditImage}
            >
              <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/screens/personal-information')}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Custom Stats Card with dark theme */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.eventsAttended}</Text>
            <Text style={styles.statLabel}>Events Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.eventsCreated}</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.connections}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>

        {/* Custom Menu List with dark theme */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Account Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemIconContainer}>
                <FontAwesome name={item.icon} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <LogoutButton 
          onPress={handleLogout}
          isLoading={isLoading}
        />
        
        {/* App Version */}
        <VersionInfo version="1.0.0" />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Header Button
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    ...createShadow(3),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...createShadow(2),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  menuContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondaryText,
    marginBottom: 16,
    marginLeft: 8,
  },
  menuItem: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...createShadow(2),
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.secondaryText,
  },
});