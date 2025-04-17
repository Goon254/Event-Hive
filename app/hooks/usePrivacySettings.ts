// app/hooks/usePrivacySettings.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettings } from '../models/connection/types';

// Constants
const API_BASE_URL = 'https://api.scangoapp.com';

/**
 * Default privacy settings
 */
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  // Basic privacy
  showOnlineStatus: true,
  allowContactDiscovery: true,
  allowRecommendations: true,
  encryptMessages: true,
  
  // User data controls
  allowDataCollection: true,
  allowUsageAnalytics: true,
  allowCrashReporting: true,
  
  // Permission management
  cameraPermission: true,
  locationPermission: false,
  contactsPermission: true,
  notificationsPermission: true,
  
  // Tracking preferences
  allowAdPersonalization: false,
  allowCrossSiteTracking: false,
  
  // Third-party data sharing
  allowThirdPartySharing: false,
  allowPartnerSharing: false,
  
  // Notification privacy
  hideNotificationContent: false,
  muteNotificationsWhenActive: true,
  
  // Content visibility
  profileVisibility: 'connections',
  activityVisibility: 'connections',
  
  // Security
  twoFactorEnabled: false,
  biometricLoginEnabled: true,
  autoLockEnabled: true,
  passwordChangeRequired: false,
};

/**
 * Hook for managing privacy settings
 * @param user User object
 * @returns Privacy settings state and functions
 */
export function usePrivacySettings(user: any) {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load privacy settings
  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settingsJson = await AsyncStorage.getItem(`privacy_settings_${user.id}`);
        
        if (settingsJson) {
          const settings = JSON.parse(settingsJson);
          setPrivacySettings(settings);
        } else {
          // If no settings found, use defaults and save them
          await saveSettings(DEFAULT_PRIVACY_SETTINGS);
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  // Save privacy settings
  const saveSettings = useCallback(async (settings: PrivacySettings) => {
    if (!user) return;
    
    try {
      await AsyncStorage.setItem(
        `privacy_settings_${user.id}`,
        JSON.stringify(settings)
      );
      
      // Update server with new settings
      await fetch(`${API_BASE_URL}/users/${user.id}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  }, [user]);
  
  // Update a single privacy setting
  const updatePrivacySetting = useCallback((key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...privacySettings, [key]: value };
    saveSettings(newSettings);
  }, [privacySettings, saveSettings]);
  
  return {
    privacySettings,
    isLoading,
    saveSettings,
    updatePrivacySetting,
  };
}

// Add default export
export default usePrivacySettings;