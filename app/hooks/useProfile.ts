// app/hooks/useProfile.ts
import { useState, useCallback } from 'react';
import { profileService } from '../services/profileService';

/**
 * Custom hook for profile-related operations
 * @param userId User ID
 * @returns Profile-related functions and state
 */
export function useProfile(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Upload a profile image
   * @param imageUri Image URI
   * @returns Promise resolving to the download URL
   */
  const uploadProfileImage = useCallback(async (imageUri: string): Promise<string> => {
    if (!userId) {
      throw new Error('User ID is required for profile image upload');
    }
    
    try {
      setIsImageUploading(true);
      setError(null);
      
      const downloadURL = await profileService.uploadProfileImage(userId, imageUri);
      return downloadURL;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload profile image');
      setError(error);
      throw error;
    } finally {
      setIsImageUploading(false);
    }
  }, [userId]);
  
  /**
   * Update profile information
   * @param profileData Profile data to update
   * @returns Promise resolving to the updated profile
   */
  const updateProfile = useCallback(async (profileData: any) => {
    if (!userId) {
      throw new Error('User ID is required for profile update');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedProfile = await profileService.updateProfile(userId, profileData);
      return updatedProfile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  /**
   * Update notification settings
   * @param settings Notification settings to update
   * @returns Promise resolving to the updated profile
   */
  const updateNotificationSettings = useCallback(async (settings: any) => {
    if (!userId) {
      throw new Error('User ID is required for notification settings update');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedProfile = await profileService.updateNotificationSettings(userId, settings);
      return updatedProfile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update notification settings');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  /**
   * Update privacy settings
   * @param settings Privacy settings to update
   * @returns Promise resolving to the updated profile
   */
  const updatePrivacySettings = useCallback(async (settings: any) => {
    if (!userId) {
      throw new Error('User ID is required for privacy settings update');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedProfile = await profileService.updatePrivacySettings(userId, settings);
      return updatedProfile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update privacy settings');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  return {
    isLoading,
    isImageUploading,
    error,
    uploadProfileImage,
    updateProfile,
    updateNotificationSettings,
    updatePrivacySettings
  };
}

// Add default export
export default useProfile;