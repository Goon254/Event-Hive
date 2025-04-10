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
 * Displays user profile information and image
 */
const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  isImageLoading,
  onEditProfilePress,
  onEditImagePress
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <View style={styles.profileCard} testID="profile-card">
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImageWrapper}>
          {(imageLoading || isImageLoading) && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator color="#007AFF" size="small" />
            </View>
          )}
          <Image
            source={profile.profileImageUrl ? { uri: profile.profileImageUrl } : require('../../../assets/images/default-avatar.png.png')}
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
          accessibilityLabel="Edit profile"
          testID="edit-profile-button"
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
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
});

export default ProfileCard;