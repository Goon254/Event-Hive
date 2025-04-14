// app/services/imageUploadService.ts
import { uploadFile, uploadMultipleFiles } from '../utils/fileUtils';

/**
 * Service for handling image uploads across the application
 * Provides a unified interface for all image upload operations
 */
class ImageUploadService {
  /**
   * Upload a profile image
   * @param userId User ID
   * @param imageUri Image URI
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the download URL
   */
  async uploadProfileImage(
    userId: string,
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      if (!userId) {
        throw new Error('User ID is required for profile image upload');
      }
      
      if (!imageUri) {
        throw new Error('Image URI is required for profile image upload');
      }
      
      const path = `profile_images/${userId}`;
      return await uploadFile(imageUri, path, undefined, onProgress);
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      throw error;
    }
  }
  
  /**
   * Upload a post image
   * @param userId User ID
   * @param imageUri Image URI
   * @param postId Optional post ID for updates
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the download URL
   */
  async uploadPostImage(
    userId: string,
    imageUri: string,
    postId?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      if (!userId) {
        throw new Error('User ID is required for post image upload');
      }
      
      if (!imageUri) {
        throw new Error('Image URI is required for post image upload');
      }
      
      const path = postId 
        ? `posts/${userId}/${postId}`
        : `posts/${userId}`;
        
      return await uploadFile(imageUri, path, undefined, onProgress);
    } catch (error) {
      console.error('Error in uploadPostImage:', error);
      throw error;
    }
  }
  
  /**
   * Upload multiple post images
   * @param userId User ID
   * @param imageUris Array of image URIs
   * @param postId Optional post ID for updates
   * @param onProgress Optional overall progress callback
   * @param onFileProgress Optional individual file progress callback
   * @returns Promise resolving to an object with URLs and errors
   */
  async uploadPostImages(
    userId: string,
    imageUris: string[],
    postId?: string,
    onProgress?: (overall: number) => void,
    onFileProgress?: (index: number, progress: number) => void
  ): Promise<{urls: string[], errors: {index: number, error: Error}[]}> {
    try {
      if (!userId) {
        throw new Error('User ID is required for post images upload');
      }
      
      if (!imageUris || imageUris.length === 0) {
        return { urls: [], errors: [] };
      }
      
      const path = postId 
        ? `posts/${userId}/${postId}`
        : `posts/${userId}`;
        
      return await uploadMultipleFiles(imageUris, path, onProgress, onFileProgress);
    } catch (error) {
      console.error('Error in uploadPostImages:', error);
      throw error;
    }
  }
  
  /**
   * Upload an event image
   * @param userId User ID
   * @param imageUri Image URI
   * @param eventId Optional event ID for updates
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the download URL
   */
  async uploadEventImage(
    userId: string,
    imageUri: string,
    eventId?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      if (!userId) {
        throw new Error('User ID is required for event image upload');
      }
      
      if (!imageUri) {
        throw new Error('Image URI is required for event image upload');
      }
      
      const path = eventId 
        ? `events/${userId}/${eventId}`
        : `events/${userId}`;
        
      return await uploadFile(imageUri, path, undefined, onProgress);
    } catch (error) {
      console.error('Error in uploadEventImage:', error);
      throw error;
    }
  }
  
  /**
   * Upload a speaker image for an event
   * @param userId User ID
   * @param imageUri Image URI
   * @param eventId Event ID
   * @param speakerId Optional speaker ID
   * @param onProgress Optional progress callback
   * @returns Promise resolving to the download URL
   */
  async uploadSpeakerImage(
    userId: string,
    imageUri: string,
    eventId: string,
    speakerId?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      if (!userId || !eventId) {
        throw new Error('User ID and Event ID are required for speaker image upload');
      }
      
      if (!imageUri) {
        throw new Error('Image URI is required for speaker image upload');
      }
      
      const path = speakerId 
        ? `events/${userId}/${eventId}/speakers/${speakerId}`
        : `events/${userId}/${eventId}/speakers`;
        
      return await uploadFile(imageUri, path, undefined, onProgress);
    } catch (error) {
      console.error('Error in uploadSpeakerImage:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const imageUploadService = new ImageUploadService();