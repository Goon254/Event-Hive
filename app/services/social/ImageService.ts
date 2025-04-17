// app/services/social/ImageService.ts
// This file is now a wrapper around the enhancedImageService
import { enhancedImageService, ImageType, ImageUploadOptions, ImageQuality, ImageSize } from '../enhancedImageService';
import * as ImagePicker from 'expo-image-picker';

/**
 * Image Service
 * Wrapper around enhancedImageService to maintain backward compatibility
 */
export class ImageService {
  /**
   * Pick an image from the device's media library
   * @param options ImagePicker options
   * @returns Promise resolving to the selected image URI or null if cancelled
   */
  async pickImage(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<string | null> {
    return enhancedImageService.pickImage(options);
  }
  
  /**
   * Take a photo using the device's camera
   * @param options ImagePicker options
   * @returns Promise resolving to the captured image URI or null if cancelled
   */
  async takePhoto(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<string | null> {
    return enhancedImageService.takePhoto(options);
  }
  
  /**
   * Process an image before upload (resize, compress, etc.)
   * @param uri Image URI
   * @param options Processing options
   * @returns Promise resolving to the processed image URI
   */
  async processImage(uri: string, options: Partial<ImageUploadOptions>): Promise<string> {
    return enhancedImageService.processImage(uri, options as ImageUploadOptions);
  }
  
  /**
   * Generate a thumbnail from an image
   * @param uri Image URI
   * @param size Thumbnail size
   * @returns Promise resolving to the thumbnail URI
   */
  async generateThumbnail(uri: string, size: number = 150): Promise<string> {
    return enhancedImageService.generateThumbnail(uri, size);
  }
  
  /**
   * Upload an image to Firebase Storage
   * @param uri Image URI
   * @param type Image type
   * @param options Upload options
   * @param id Optional ID (post ID, event ID, etc.)
   * @returns Promise resolving to an object with image URLs and metadata
   */
  async uploadImage(
    uri: string,
    type: ImageType,
    options?: Partial<ImageUploadOptions>,
    id?: string
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
  }> {
    const result = await enhancedImageService.uploadImage(uri, type, options, id);
    return {
      url: result.url,
      thumbnailUrl: result.thumbnailUrl
    };
  }
  
  /**
   * Upload multiple post images
   * @param userId User ID
   * @param imageUris Array of image URIs
   * @param postId Optional post ID
   * @param onProgress Optional progress callback
   * @returns Promise resolving to an object with URLs and errors
   */
  async uploadPostImages(
    userId: string,
    imageUris: string[],
    postId?: string,
    onProgress?: (progress: number) => void
  ): Promise<{
    urls: string[];
    errors: { index: number; error: Error }[];
  }> {
    try {
      if (!userId) {
        throw new Error('User ID is required for post images upload');
      }
      
      if (!imageUris || imageUris.length === 0) {
        return { urls: [], errors: [] };
      }
      
      const urls: string[] = [];
      const errors: { index: number; error: Error }[] = [];
      const totalImages = imageUris.length;
      let completedImages = 0;
      
      // Process and upload each image
      for (let i = 0; i < imageUris.length; i++) {
        try {
          // Create individual progress handler
          const individualProgress = (progress: number) => {
            if (onProgress) {
              // Calculate overall progress
              const overallProgress = (completedImages + progress) / totalImages;
              onProgress(overallProgress);
            }
          };
          
          // Upload the image using enhancedImageService
          const result = await enhancedImageService.uploadPostImage(
            imageUris[i],
            postId,
            {
              onProgress: individualProgress
            }
          );
          
          urls.push(result.url);
        } catch (error) {
          console.error(`Error uploading image at index ${i}:`, error);
          errors.push({
            index: i,
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
        
        completedImages++;
        
        // Update overall progress
        if (onProgress) {
          onProgress(completedImages / totalImages);
        }
      }
      
      return { urls, errors };
    } catch (error) {
      console.error('Error uploading post images:', error);
      throw new Error(`Failed to upload post images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Upload a profile image
   * @param uri Image URI
   * @param options Upload options
   * @returns Promise resolving to the profile image URL
   */
  async uploadProfileImage(
    uri: string,
    options?: Partial<ImageUploadOptions>
  ): Promise<string> {
    return enhancedImageService.uploadProfileImage(uri, options);
  }
  
  /**
   * Upload a post image
   * @param uri Image URI
   * @param postId Optional post ID
   * @param options Upload options
   * @returns Promise resolving to an object with image URLs
   */
  async uploadPostImage(
    uri: string,
    postId?: string,
    options?: Partial<ImageUploadOptions>
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
  }> {
    return enhancedImageService.uploadPostImage(uri, postId, options);
  }
  
  /**
   * Upload an event image
   * @param uri Image URI
   * @param eventId Optional event ID
   * @param options Upload options
   * @returns Promise resolving to an object with image URLs
   */
  async uploadEventImage(
    uri: string,
    eventId?: string,
    options?: Partial<ImageUploadOptions>
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
  }> {
    return enhancedImageService.uploadEventImage(uri, eventId, options);
  }
}

// Export a singleton instance
export const imageService = new ImageService();

// Re-export types from enhancedImageService for backward compatibility
export { ImageType, ImageQuality, ImageSize, ImageUploadOptions } from '../enhancedImageService';