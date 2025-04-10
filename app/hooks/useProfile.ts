// app/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { profileService, UserProfile } from '../services/profileService';

/**
 * Hook for managing user profile
 * @param userId User ID
 * @returns Profile state and functions
 */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const userProfile = await profileService.fetchProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
      
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to load profile data. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Update profile
  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!userId) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedProfile = await profileService.updateProfile(userId, profileData);
      setProfile(updatedProfile);
      
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again later.',
        [{ text: 'OK' }]
      );
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId]);

  // Upload profile image
  const uploadProfileImage = useCallback(async (imageUri: string) => {
    if (!userId) return null;
    
    try {
      setIsImageUploading(true);
      setError(null);
      
      const imageUrl = await profileService.uploadProfileImage(userId, imageUri);
      
      // Update profile with new image URL
      setProfile(prev => prev ? { ...prev, profileImageUrl: imageUrl } : null);
      
      return imageUrl;
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError('Failed to upload profile image');
      
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to upload profile image. Please try again later.',
        [{ text: 'OK' }]
      );
      
      return null;
    } finally {
      setIsImageUploading(false);
    }
  }, [userId]);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (
    settings: Partial<{
      email: boolean;
      push: boolean;
      sms: boolean;
    }>
  ) => {
    if (!userId || !profile) return false;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      // Merge with existing settings
      const updatedSettings = {
        ...profile.settings?.notifications,
        ...settings
      };
      
      const updatedProfile = await profileService.updateNotificationSettings(
        userId,
        updatedSettings as {
          email: boolean;
          push: boolean;
          sms: boolean;
        }
      );
      
      setProfile(updatedProfile);
      
      return true;
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings');
      
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again later.',
        [{ text: 'OK' }]
      );
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, profile]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (
    settings: Partial<{
      profileVisibility: 'public' | 'connections' | 'private';
      locationSharing: boolean;
      activityVisibility: 'public' | 'connections' | 'private';
    }>
  ) => {
    if (!userId || !profile) return false;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      // Merge with existing settings
      const updatedSettings = {
        ...profile.settings?.privacy,
        ...settings
      };
      
      const updatedProfile = await profileService.updatePrivacySettings(
        userId,
        updatedSettings as {
          profileVisibility: 'public' | 'connections' | 'private';
          locationSharing: boolean;
          activityVisibility: 'public' | 'connections' | 'private';
        }
      );
      
      setProfile(updatedProfile);
      
      return true;
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError('Failed to update privacy settings');
      
      // Show error alert
      Alert.alert(
        'Error',
        'Failed to update privacy settings. Please try again later.',
        [{ text: 'OK' }]
      );
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, profile]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    isImageUploading,
    fetchProfile,
    updateProfile,
    uploadProfileImage,
    updateNotificationSettings,
    updatePrivacySettings
  };
}