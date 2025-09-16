// app/(tabs)/profile.tsx
import React, { useEffect, useState, useRef } from 'react';
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
  Pressable,
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenLayout from '../components/common/ScreenLayout';
import ScreenWrapper from '../components/common/ScreenWrapper';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { enhancedImageService, ImageType, ImageQuality, ImageSize } from '../services/enhancedImageService';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SharedElement } from 'react-navigation-shared-element';
import DSButton from '../components/design-system/Button';

// Custom hooks
import { useProfile } from '../hooks/useProfile';
import { useConnections } from '../hooks/useConnections';

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

// Define color map for icon backgrounds
const iconColors = {
  'user': '#42A5F5',
  'history': '#AB47BC',
  'users': '#26A69A',
  'user-plus': '#FF7043',
  'compass': '#26C6DA',
  'shield': '#EF5350',
  'bell': '#FFA726',
  'credit-card': '#66BB6A',
  'gear': '#8D6E63',
  'question-circle': '#5C6BC0',
};

/**
 * Profile Screen
 * Main screen for user profile and account settings
 */
export default function ProfileScreen() {
  const { user, signOut, error, clearError, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Use the profile hook to manage profile data
  const {
    isLoading: profileLoading,
    isImageUploading,
    uploadProfileImage,
  } = useProfile(user?.id);
  
  // Use the connections hook to get pending connections
  const {
    connections,
    pendingConnections,
    isLoading: connectionsLoading,
  } = useConnections(user);
  
  // Update profile stats when connections data is loaded
  useEffect(() => {
    if (connections && profile) {
      setProfile(prev => (prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          connections: connections.length
        }
      } : prev));
    }
  }, [connections]);
  
  // For this example, we'll use a placeholder profile
  type ProfileModel = {
    id: string;
    name: string;
    email: string;
    profileImageUrl?: string | null;
    location?: string;
    bio?: string;
    badges: string[];
    stats: { eventsAttended: number; eventsCreated: number; connections: number };
  };
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  
  // Fetch profile data when component mounts
  useEffect(() => {
    if (user?.id) {
      // In a real implementation, this would fetch the profile from a service
      setProfile({
        id: user.id,
        name: user.name || 'User',
        email: user.email || '',
        profileImageUrl: user.avatar,
        location: 'Manchester, NH',
        bio: 'Event Enthusiast',
        badges: ['Top Host', 'Early Adopter'],
        stats: {
          eventsAttended: 12,
          eventsCreated: 5,
          connections: 0 // Will be updated with actual connections count
        }
      });
    }
  }, [user]);

  // Combined loading state
  const isLoading = authLoading || profileLoading || connectionsLoading;

  useEffect(() => {
    // Start animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
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
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
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
      setProfile((prev) => (prev ? {
        ...prev,
        profileImageUrl: user.avatar
      } : prev));
    }
  };

  const toggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const navigateWithAnimation = (route: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  // Define menu sections
  const menuSections = [
    {
      id: 'personal',
      title: '👤 Personal',
      items: [
        {
          icon: 'user',
          title: 'Personal Information',
          description: 'View and update your profile details',
          onPress: () => navigateWithAnimation('/screens/personal-information'),
        },
        {
          icon: 'history',
          title: 'Event History',
          description: 'View your past events',
          onPress: () => navigateWithAnimation('/screens/event-history'),
        },
      ]
    },
    {
      id: 'connections',
      title: '🔗 Connections',
      items: [
        {
          icon: 'users',
          title: 'My Connections',
          description: 'Manage your network',
          onPress: () => navigateWithAnimation('/screens/NetworkScreen'),
        },
        {
          icon: 'user-plus',
          title: 'Connection Requests',
          description: 'View and manage pending requests',
          onPress: () => navigateWithAnimation('/screens/NetworkScreen?tab=pending'),
          badge: pendingConnections?.length || 0,
        },
        {
          icon: 'compass',
          title: 'Discover People',
          description: 'Find new connections',
          onPress: () => navigateWithAnimation('/screens/NetworkScreen?tab=discover'),
        },
      ]
    },
    {
      id: 'security',
      title: '🔐 Security & Privacy',
      items: [
        {
          icon: 'shield',
          title: 'Privacy & Security',
          description: 'Control your account security settings',
          onPress: () => navigateWithAnimation('/screens/privacy'),
        },
        {
          icon: 'bell',
          title: 'Notifications',
          description: 'Manage your alerts and reminders',
          onPress: () => navigateWithAnimation('/screens/notifications'),
          badge: 3, // Example notification count
        },
      ]
    },
    {
      id: 'payment',
      title: '💳 Payment',
      items: [
        {
          icon: 'credit-card',
          title: 'Payment Methods',
          description: 'Manage your payment options',
          onPress: () => navigateWithAnimation('/screens/payment-methods'),
        },
      ]
    },
    {
      id: 'app',
      title: '⚙️ App Settings',
      items: [
        {
          icon: 'gear',
          title: 'Preferences',
          description: 'Customize app appearance and behavior',
          onPress: () => navigateWithAnimation('/screens/settings'),
        },
        {
          icon: 'question-circle',
          title: 'Help & Support',
          description: 'Get assistance and FAQs',
          onPress: () => navigateWithAnimation('/screens/help'),
        },
      ]
    },
  ];

  // Create header right content
  const headerRightContent = (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/screens/settings');
      }}
      activeOpacity={0.7}
    >
      <MaterialIcons name="settings" size={22} color="#FFF" />
    </TouchableOpacity>
  );


  if (isLoading) {
    return (
      <ScreenWrapper
        backgroundColor={COLORS.background}
        statusBarStyle="light-content"
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
      backgroundImage={require('../../assets/images/tropical-gradient.png')}
      backgroundOpacity={0.15}
    >
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentWithHeader}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card with enhanced styling */}
        <Animated.View
          style={[styles.profileCardContainer, { opacity: fadeAnim }]}
        >
          <View style={styles.profileCard}>
            {/* Background image for consistent design aesthetic */}
            <Image
              source={require('../../assets/images/tropical-gradient.png')}
              style={styles.cardBackgroundImage}
              resizeMode="cover"
            />
            <View style={styles.profileImageOuterContainer}>
              <View style={styles.profileImageContainer}>
                {profile.profileImageUrl ? (
                  <SharedElement id={`profile.image.${profile.id}`}>
                    <Image
                      source={{ uri: profile.profileImageUrl }}
                      style={styles.profileImage}
                    />
                  </SharedElement>
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImagePlaceholderText}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.editImageButton}
                onPress={handleEditImage}
                activeOpacity={0.8}
              >
                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.bioContainer}>
              <Text style={styles.profileBio}>{profile.bio} • {profile.location}</Text>
            </View>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            
            {/* Badges row */}
            <View style={styles.badgesContainer}>
              {profile.badges.map((badge, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
            
            <DSButton
              title="Edit Profile"
              onPress={() => navigateWithAnimation('/screens/personal-information')}
            />
            
            {/* Share profile button */}
            <DSButton
              title="Share Profile"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Share Profile', 'Share your profile with others');
              }}
              variant="ghost"
              leftIcon={<Ionicons name="share-outline" size={18} color={COLORS.primary} />}
            />
          </View>
        </Animated.View>
        
        {/* Interactive Stats Card */}
        <Animated.View 
          style={[styles.statsCardContainer, { 
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}]
          }]}
        >
          <View style={styles.statsCard}>
            <Pressable 
              style={styles.statItem}
              onPress={() => navigateWithAnimation('/screens/events-attended')}
              android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
            >
              <Text style={styles.statValue}>{profile.stats.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events Attended</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable 
              style={styles.statItem}
              onPress={() => navigateWithAnimation('/screens/events-created')}
              android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
            >
              <Text style={styles.statValue}>{profile.stats.eventsCreated}</Text>
              <Text style={styles.statLabel}>Events Created</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable 
              style={styles.statItem}
              onPress={() => navigateWithAnimation('/screens/NetworkScreen')}
              android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
            >
              <Text style={styles.statValue}>{profile.stats.connections}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Profile QR Code */}
        <Animated.View 
          style={[styles.qrCodeContainer, { 
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            })}]
          }]}
        >
          <DSButton
            title="My Profile QR Code"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateWithAnimation('/screens/profile-qr');
            }}
            variant="ghost"
            leftIcon={<MaterialIcons name="qr-code" size={20} color={COLORS.primary} />}
          />
        </Animated.View>

        {/* Collapsible Menu Sections */}
        <Animated.View 
          style={[styles.menuContainer, { 
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0]
            })}]
          }]}
        >
          {menuSections.map((section) => (
            <View key={section.id} style={styles.menuSection}>
              <TouchableOpacity 
                style={[
                  styles.menuSectionHeader,
                  expandedSection === section.id && styles.menuSectionHeaderActive
                ]}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.menuSectionTitle}>{section.title}</Text>
                <MaterialIcons 
                  name={expandedSection === section.id ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={COLORS.secondaryText} 
                />
              </TouchableOpacity>
              
              {expandedSection === section.id && (
                <View style={styles.menuItemsContainer}>
                  {section.items.map((item, index) => (
                    <TouchableOpacity
                      key={item.title}
                      style={[
                        styles.menuItem,
                        index === section.items.length - 1 && styles.menuItemLast
                      ]}
                      onPress={item.onPress}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.menuItemIconContainer,
                          { backgroundColor: iconColors[item.icon as keyof typeof iconColors] || 'rgba(0,0,0,0.08)' }
                        ]}
                      >
                        <FontAwesome name={item.icon as any} size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                      {item.badge && (
                        <View style={styles.menuItemBadge}>
                          <Text style={styles.menuItemBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <MaterialIcons name="chevron-right" size={24} color={COLORS.secondaryText} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Animated.View>

        {/* Logout Button */}
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}]
          }}
        >
          <LogoutButton 
            onPress={handleLogout}
            isLoading={isLoading}
          />
        </Animated.View>
        
        {/* App Version */}
        <VersionInfo version="1.0.0" />
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
  scrollContentWithHeader: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileCardContainer: {
    paddingHorizontal: 16,
    marginTop: 30,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
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
  profileImageOuterContainer: {
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    backgroundColor: COLORS.card,
    ...createShadow(5),
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImagePlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
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
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: 'rgba(126, 87, 194, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.3)',
  },
  badgeText: {
    color: '#9575CD',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    ...createShadow(4),
    marginBottom: 12,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shareProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(126, 87, 194, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.2)',
  },
  shareProfileButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  statsCardContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
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
  qrCodeContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  qrCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(126, 87, 194, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.2)',
  },
  qrCodeButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
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
  menuSectionHeaderActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItemsContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 0,
    marginTop: 0,
    ...createShadow(0),
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
  
  menuItemLast: {
    borderBottomWidth: 0,
  },
  
  menuItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // neutral, fallback if no specific color
  },
  
  
  menuItemContent: {
    flex: 1,
  },
  
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  
  menuItemDescription: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  
  menuItemBadge: {
    backgroundColor: '#E53935',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
  },
  
  menuItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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