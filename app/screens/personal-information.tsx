// app/screens/personal-information.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenWrapper from '../components/common/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedElement } from 'react-navigation-shared-element';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileService } from '../services/profileService';
import { Image } from 'expo-image';
import {
  InfoRow,
  VerificationBadge,
  Divider
} from '../components/profile';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, Z_INDEX } from '../theme/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive calculation helpers
const scale = (size: number): number => {
  const baseWidth = 375; // Base width (iPhone X)
  return (SCREEN_WIDTH / baseWidth) * size;
};

interface UserInformation {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  dateOfBirth: string;
  profilePicture: string;
  isEmailVerified?: boolean;
}

export default function ViewPersonalInformationScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0.01)).current; // Start at 0.01 to ensure minimal visibility
  const insets = useSafeAreaInsets();
  
  // User information state
  const [userInfo, setUserInfo] = useState<UserInformation>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    profilePicture: '',
    isEmailVerified: true,
  });

  // Animate content on load - with safer animation settings
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false, // Changed to false for better compatibility
    }).start();
  }, [fadeAnim]);

  // Fetch user data from database with improved error handling
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) return; // Guard against missing user
      
      try {
        setIsLoading(true);
        
        // Use profile service to fetch user details
        const userProfile = await profileService.fetchProfile(user.id);
        
        if (userProfile) {
          setUserInfo({
            name: userProfile.name || '',
            email: userProfile.email || '',
            phone: userProfile.phoneNumber || '',
            bio: userProfile.bio || '',
            // Improved location formatting to handle missing data
            location: `${userProfile.city || ''}, ${userProfile.country || ''}`.replace(', ,', ',').replace(/^,\s|,\s$/g, ''),
            dateOfBirth: '', // Default value since it's not in the UserProfile interface
            profilePicture: userProfile.profileImageUrl || (user.avatar || ''),
            isEmailVerified: true, // Default value since it's not in the UserProfile interface
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert(
          'Error',
          'Failed to load your profile information. Please try again later.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  const navigateToEditScreen = () => {
    // Navigate to edit screen when implemented
    Alert.alert('Coming Soon', 'Edit functionality will be available soon.');
  };

  const viewFullSizeImage = () => {
    if (!userInfo.profilePicture) return;
    
    // Navigate to image viewer screen with the profile image
    router.push({
      pathname: '/image-viewer',
      params: { 
        imageUri: userInfo.profilePicture,
        title: userInfo.name
      }
    });
  };

  // Guard against missing user data - added protection
  if (!user || !user.id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Signing in...</Text>
      </View>
    );
  }

  // Guard against loading states or missing profile data
  if (isLoading || authLoading || !userInfo.name) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }


  return (
    <ScreenWrapper
      header={{ hidden: true }}
      backgroundColor={COLORS.background}
      statusBarStyle="light-content"
      backgroundImage={require('../../assets/images/tropical-gradient.png')}
      backgroundOpacity={0.15}
    >
        
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + scale(30) }
          ]}
          showsVerticalScrollIndicator={false}
          style={{
            // Improved animation with interpolate to ensure visibility
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.01, 1] // Never fully transparent
            })
          }}
          scrollEventThrottle={16}
        >
          {/* Hero Section with Profile Image and Basic Info */}
          <Animated.View style={styles.heroSection}>
            {/* Profile Image with Glowing Border */}
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={viewFullSizeImage}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`View ${userInfo.name}'s profile picture`}
            >
              <SharedElement id={`user.avatar.${user?.id}`}>
                <LinearGradient
                  colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
                  style={styles.profileImageBorder}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={{ uri: userInfo.profilePicture || undefined }}
                      placeholder={require('../../assets/images/default-avatar.png')}
                      style={styles.profileImage}
                      contentFit="cover"
                      transition={300}
                      accessibilityLabel="Profile picture"
                    />
                  </View>
                </LinearGradient>
              </SharedElement>
            </TouchableOpacity>
            
            {/* Name and Bio */}
            <Text
              style={styles.userName}
              accessibilityRole="header"
            >
              {userInfo.name}
            </Text>
            <Text
              style={styles.userBio}
              accessibilityLabel={`Bio: ${userInfo.bio}`}
            >
              {userInfo.bio || 'No bio provided yet'}
            </Text>
            
            {/* Location Badge */}
            <View
              style={styles.locationBadge}
              accessibilityLabel={`Location: ${userInfo.location}`}
            >
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.locationText}>{userInfo.location || 'Location not set'}</Text>
            </View>
          </Animated.View>
          
          {/* Contact Information Card */}
          <Animated.View style={styles.cardContainer}>
            <Text
              style={styles.cardTitle}
              accessibilityRole="header"
            >
              Contact Information
            </Text>
            
            {/* Email Row with Verification Badge */}
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={userInfo.email || 'No email provided'}
              rightContent={
                <VerificationBadge isVerified={!!userInfo.isEmailVerified} />
              }
            />
            
            <Divider />
            
            {/* Phone Row */}
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={maskPhoneNumber(userInfo.phone)}
            />
          </Animated.View>
          
          {/* Basic Information Card */}
          <Animated.View style={styles.cardContainer}>
            <Text
              style={styles.cardTitle}
              accessibilityRole="header"
            >
              Basic Information
            </Text>
            
            {/* Date of Birth Row */}
            <InfoRow
              icon="calendar-outline"
              label="Date of Birth"
              value={userInfo.dateOfBirth || 'Not provided'}
            />
            
            <Divider />
            
            {/* Location Row */}
            <InfoRow
              icon="location-outline"
              label="Location"
              value={userInfo.location || 'Not provided'}
            />
          </Animated.View>
          
          {/* Edit Button */}
          <Animated.View style={styles.editButtonContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={navigateToEditScreen}
              accessibilityRole="button"
              accessibilityLabel="Edit your personal information"
            >
              <View style={styles.editButtonContent}>
                <FontAwesome5 name="pencil-alt" size={16} color="#FFFFFF" style={styles.editIcon} />
                <Text style={styles.editButtonText}>Edit Information</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.ScrollView>
    </ScreenWrapper>
  );
}

// Helper function to mask phone number
const maskPhoneNumber = (phone: string): string => {
  if (!phone) return 'Not provided';
  
  // Keep only the last 4 digits visible
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) return phone;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${masked.slice(0, 3)}) ${masked.slice(3, 6)}-${lastFour}`;
  }
  
  return `${masked}${lastFour}`;
};
// Styles for the personal information screen
const styles = StyleSheet.create({
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },

  // Container and background
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },

  // Scroll content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
    paddingBottom: scale(30),
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    marginBottom: scale(24),
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    ...createShadow(8),
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  profileImageContainer: {
    marginBottom: scale(20),
  },
  profileImageBorder: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    padding: 3,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(5),
  },
  profileImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: scale(55),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: scale(55),
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.card,
    ...createShadow(3),
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: scale(6),
    textAlign: 'center',
  },
  userBio: {
    fontSize: 16,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: scale(16),
    paddingHorizontal: scale(20),
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(126, 87, 194, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.3)',
  },
  locationText: {
    color: '#9575CD',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Card containers
  cardContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: scale(20),
    marginBottom: scale(16),
    ...createShadow(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },

  // Edit button
  editButtonContainer: {
    marginTop: scale(16),
    marginBottom: scale(24),
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    ...createShadow(4),
    minWidth: scale(200),
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Stats elements (adding from original styles)
  statsCardContainer: {
    marginTop: scale(16),
    marginBottom: scale(16),
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...createShadow(4),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  
  // Menu system (adding from original)
  menuSection: {
    marginBottom: 16,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 2,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    backgroundColor: 'transparent',
  },
  menuItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(126, 87, 194, 0.15)',
  },
});