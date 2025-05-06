// app/components/profile/ProfileCard.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { createShadow } from '../../utils/platformUtils';
import { UserProfile } from '../../services/profileService';

interface ProfileCardProps {
  profile: UserProfile;
  isImageLoading: boolean;
  onEditProfilePress: () => void;
  onEditImagePress: () => void;
}

/**
 * Profile card component
 * Displays user profile information and image with enhanced visual styling
 */
const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  isImageLoading,
  onEditProfilePress,
  onEditImagePress
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <BlurView intensity={20} tint="light" style={styles.blurContainer}>
      <View style={styles.profileCard} testID="profile-card">
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            {(imageLoading || isImageLoading) && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator color="#7C3AED" size="small" />
              </View>
            )}
            <Image
              source={profile.profileImageUrl ? { uri: profile.profileImageUrl } : require('../../../assets/images/default-avatar.png')}
              style={styles.profileImage}
              accessibilityLabel="Profile picture"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </View>
          <TouchableOpacity
            style={styles.editImageButton}
            onPress={onEditImagePress}
            accessibilityLabel="Edit profile picture"
            testID="edit-image-button"
          >
            <FontAwesome name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile.name || 'Your Name'}</Text>
          <Text style={styles.email}>{profile.email || 'email@example.com'}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onEditProfilePress}
            activeOpacity={0.8}
            accessibilityLabel="Edit profile"
            testID="edit-profile-button"
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editProfileGradient}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(1);
const imageShadow = createShadow(2);

const styles = StyleSheet.create({
  blurContainer: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  profileCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    ...cardShadow,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImageWrapper: {
    borderRadius: 60,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...imageShadow,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
  editImageButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#7C3AED',
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937', // Adjusted to maintain readability instead of white
    marginBottom: 6,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: '#6B7280', // Adjusted from D1D5DB for better readability
    marginBottom: 20,
  },
  editProfileButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  editProfileGradient: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default ProfileCard;