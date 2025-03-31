// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow, safeTopPadding } from '../utils/platformUtils';

export default function ProfileScreen() {
  const { user, signOut, error, clearError, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [imageLoading, setImageLoading] = useState(true);
  // Animation for menu items
  const [fadeAnim] = useState(new Animated.Value(0));

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

  type FontAwesomeIconName = 'user' | 'gear' | 'bell' | 'shield' | 'question-circle' | 'credit-card' | 'history';

  const menuItems: { 
    icon: FontAwesomeIconName; 
    title: string; 
    description?: string;
    onPress: () => void;
    badge?: number | null;
  }[] = [
    {
      icon: 'user',
      title: 'Personal Information',
      description: 'Update your profile details',
      onPress: () => router.push('//screens/personal-information'),
    },
    {
      icon: 'credit-card',
      title: 'Payment Methods',
      description: 'Manage your payment options',
      onPress: () => router.push('//screens/payment-methods'),
    },
    {
      icon: 'history',
      title: 'Event History',
      description: 'View your past events',
      onPress: () => router.push('//screens/event-history'),
    },
    {
      icon: 'bell',
      title: 'Notifications',
      description: 'Manage your alerts and reminders',
      onPress: () => router.push('//screens/notifications'),
      badge: 3, // Example notification count
    },
    {
      icon: 'shield',
      title: 'Privacy & Security',
      description: 'Control your account security settings',
      onPress: () => router.push('//screens/privacy'),
    },
    {
      icon: 'gear',
      title: 'Settings',
      description: 'Customize app preferences',
      onPress: () => router.push('//screens/settings'),
    },
    {
      icon: 'question-circle',
      title: 'Help & Support',
      description: 'Get assistance and FAQs',
      onPress: () => router.push('//screens/help'),
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { paddingTop: Math.max(insets.top, 20) }
      ]}>
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/screens/settings')}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <FontAwesome name="cog" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              {imageLoading && (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator color="#007AFF" size="small" />
                </View>
              )}
              <Image
                source={{ uri: user.avatar || 'https://via.placeholder.com/150' }}
                style={styles.profileImage}
                accessibilityLabel="Profile picture"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </View>
            <TouchableOpacity
              style={styles.editImageButton}
              accessibilityLabel="Edit profile picture"
            >
              <FontAwesome name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name || 'Your Name'}</Text>
            <Text style={styles.email}>{user.email || 'email@example.com'}</Text>
            
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => router.push('/screens/personal-information')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Events Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
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
                  index === menuItems.length - 1 && styles.menuItemLast
                ]}
                onPress={item.onPress}
                disabled={isLoading}
                accessibilityLabel={item.title}
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

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
          accessibilityLabel="Logout button"
        >
          <FontAwesome name="sign-out" size={18} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

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
  return colors[icon] || '#6B7280';
};

// Platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(1);

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
  profileCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    ...cardShadow,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImageWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
    ...cardShadow,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  editImageButton: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
    ...buttonShadow,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    marginBottom: 4,
    color: '#1F2937',
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    ...cardShadow,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
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
    marginBottom: 24,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    ...buttonShadow,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
  }
});