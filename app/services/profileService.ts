// app/services/profileService.ts
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeForFirestore } from './migrationService';
import { enhancedImageService, ImageType, ImageQuality, ImageSize } from './enhancedImageService';

// Constants
const API_BASE_URL = 'https://api.scangoapp.com';
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  interests: string[];
  userType: string;
  organizationName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  stats?: {
    eventsAttended: number;
    eventsCreated: number;
    connections: number;
  };
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'connections' | 'private';
      locationSharing: boolean;
      activityVisibility: 'public' | 'connections' | 'private';
    };
  };
}

interface ProfileCache {
  profile: UserProfile;
  timestamp: number;
  expiresAt: number;
}

/**
 * Service for handling profile operations
 */
export class ProfileService {
  /**
   * Fetch user profile
   * @param userId User ID
   * @returns Promise resolving to user profile
   */
  async fetchProfile(userId: string): Promise<UserProfile> {
    try {
      // Try to load from cache first
      const cachedData = await this.loadProfileFromCache(userId);
      
      if (cachedData && Date.now() < cachedData.expiresAt) {
        console.log('Using cached profile');
        return cachedData.profile;
      }
      
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      
      // Fetch user stats
      const stats = await this.fetchUserStats(userId);
      
      // Construct profile object
      const profile: UserProfile = {
        id: userId,
        name: userData.name || userData.displayName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || null,
        city: userData.city || null,
        country: userData.country || null,
        bio: userData.bio || null,
        interests: userData.interests || [],
        userType: userData.userType || 'attendee',
        organizationName: userData.organizationName || null,
        profileImageUrl: userData.profileImageUrl || userData.photoURL || null,
        createdAt: userData.createdAt || new Date().toISOString(),
        stats,
        settings: {
          notifications: userData.settings?.notifications || {
            email: true,
            push: true,
            sms: false
          },
          privacy: userData.settings?.privacy || {
            profileVisibility: 'public',
            locationSharing: true,
            activityVisibility: 'connections'
          }
        }
      };
      
      // Cache the profile
      await this.cacheProfile(userId, profile);
      
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }
  
  /**
   * Update user profile
   * @param userId User ID
   * @param profileData Profile data to update
   * @returns Promise resolving to updated profile
   */
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Sanitize the data to remove any undefined values
      const sanitizedData = sanitizeForFirestore(profileData);
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', userId), {
        ...sanitizedData,
        updatedAt: serverTimestamp()
      });
      
      // Clear cache
      await AsyncStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      
      // Fetch and return updated profile
      return await this.fetchProfile(userId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
  
  /**
   * Upload profile image
   * @param userId User ID
   * @param imageUri Image URI
   * @returns Promise resolving to image URL
   */
  async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required for profile image upload');
      }
      
      if (!imageUri) {
        throw new Error('Image URI is required for profile image upload');
      }
      
      // Configure upload options
      const uploadOptions = {
        quality: ImageQuality.HIGH,
        maxWidth: ImageSize.MEDIUM,
        maxHeight: ImageSize.MEDIUM,
        compress: true,
        generateThumbnail: true,
        thumbnailSize: 150,
        metadata: {
          userId,
          updatedAt: new Date().toISOString(),
          source: 'profile-service'
        },
        onProgress: (progress: number) => {
          // Optional: Handle progress updates if needed
          console.log(`Profile image upload progress: ${progress * 100}%`);
        }
      };
      
      // Upload the image using the enhanced image service
      const downloadURL = await enhancedImageService.uploadProfileImage(imageUri, uploadOptions);
      
      // Update the user profile with the new image URL
      try {
        await updateDoc(doc(db, 'users', userId), {
          profileImageUrl: downloadURL,
          updatedAt: serverTimestamp()
        });
      } catch (updateError) {
        console.error('Error updating user profile with image URL:', updateError);
        throw new Error('Failed to update profile with new image URL');
      }
      
      // Clear cache
      await AsyncStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }
  
  /**
   * Fetch user stats
   * @param userId User ID
   * @returns Promise resolving to user stats
   */
  private async fetchUserStats(userId: string): Promise<UserProfile['stats']> {
    try {
      // Fetch events attended
      const attendingEventsQuery = query(
        collection(db, 'events'),
        where('attendees', 'array-contains', userId)
      );
      const attendingEventsSnapshot = await getDocs(attendingEventsQuery);
      const eventsAttended = attendingEventsSnapshot.size;
      
      // Fetch events created
      const createdEventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', userId)
      );
      const createdEventsSnapshot = await getDocs(createdEventsQuery);
      const eventsCreated = createdEventsSnapshot.size;
      
      // Fetch connections
      const connectionsQuery = query(
        collection(db, 'connections'),
        where('userId', '==', userId),
        where('status', '==', 'accepted')
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connections = connectionsSnapshot.size;
      
      return {
        eventsAttended,
        eventsCreated,
        connections
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        eventsAttended: 0,
        eventsCreated: 0,
        connections: 0
      };
    }
  }
  
  /**
   * Cache profile
   * @param userId User ID
   * @param profile Profile to cache
   */
  private async cacheProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      const cacheData: ProfileCache = {
        profile,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY,
      };
      
      await AsyncStorage.setItem(
        `${PROFILE_CACHE_KEY}_${userId}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }
  
  /**
   * Load profile from cache
   * @param userId User ID
   * @returns Promise resolving to cached profile or null
   */
  private async loadProfileFromCache(userId: string): Promise<ProfileCache | null> {
    try {
      const cacheJson = await AsyncStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
      
      if (cacheJson) {
        return JSON.parse(cacheJson) as ProfileCache;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading profile from cache:', error);
      return null;
    }
  }
  
  /**
   * Update notification settings
   * @param userId User ID
   * @param settings Notification settings to update
   * @returns Promise resolving to updated profile
   */
  async updateNotificationSettings(
    userId: string, 
    settings: Partial<UserProfile['settings']['notifications']>
  ): Promise<UserProfile> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        'settings.notifications': settings,
        updatedAt: serverTimestamp()
      });
      
      // Clear cache
      await AsyncStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      
      // Fetch and return updated profile
      return await this.fetchProfile(userId);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }
  
  /**
   * Update privacy settings
   * @param userId User ID
   * @param settings Privacy settings to update
   * @returns Promise resolving to updated profile
   */
  async updatePrivacySettings(
    userId: string, 
    settings: Partial<UserProfile['settings']['privacy']>
  ): Promise<UserProfile> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        'settings.privacy': settings,
        updatedAt: serverTimestamp()
      });
      
      // Clear cache
      await AsyncStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      
      // Fetch and return updated profile
      return await this.fetchProfile(userId);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const profileService = new ProfileService();