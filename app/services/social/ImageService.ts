// app/services/social/ImageService.ts
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { auth } from '../../../lib/firebaseConfig';
import { firebaseStorageRepository, StorageUploadOptions } from '../../repositories/implementations/FirebaseStorageRepository';
import { ImageQuality, ImageSize, ImageType } from '../enhancedImageService';

/**
 * Interface for image upload options
 */
export interface ImageUploadOptions {
  quality?: ImageQuality;
  maxWidth?: ImageSize;
  maxHeight?: ImageSize;
  compress?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

/**
 * Default options for different image types
 */
const DEFAULT_OPTIONS: Record<ImageType, ImageUploadOptions> = {
  [ImageType.PROFILE]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.MEDIUM,
    maxHeight: ImageSize.MEDIUM,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 150
  },
  [ImageType.POST]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.LARGE,
    maxHeight: ImageSize.LARGE,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 300
  },
  [ImageType.EVENT]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.LARGE,
    maxHeight: ImageSize.LARGE,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 300
  },
  [ImageType.EVENT_SPEAKER]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.MEDIUM,
    maxHeight: ImageSize.MEDIUM,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 150
  },
  [ImageType.TEST]: {
    quality: ImageQuality.MEDIUM,
    maxWidth: ImageSize.MEDIUM,
    maxHeight: ImageSize.MEDIUM,
    compress: true,
    generateThumbnail: false
  }
};

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Image Service
 * Provides a unified interface for all image operations with improved error handling,
 * image optimization, and consistent path structure
 */
export class ImageService {
  /**
   * Pick an image from the device's media library
   * @param options ImagePicker options
   * @returns Promise resolving to the selected image URI or null if cancelled
   */
  async pickImage(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<string | null> {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }
      
      // Default options
      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false
      };
      
      // Merge with user options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync(mergedOptions);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw new Error(`Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Take a photo using the device's camera
   * @param options ImagePicker options
   * @returns Promise resolving to the captured image URI or null if cancelled
   */
  async takePhoto(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<string | null> {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access camera was denied');
      }
      
      // Default options
      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false
      };
      
      // Merge with user options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync(mergedOptions);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error(`Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Process an image before upload (resize, compress, etc.)
   * @param uri Image URI
   * @param options Processing options
   * @returns Promise resolving to the processed image URI
   */
  async processImage(uri: string, options: ImageUploadOptions): Promise<string> {
    try {
      if (!uri) {
        throw new Error('Image URI is required');
      }
      
      // Check if we need to process the image
      if (!options.compress && options.quality === ImageQuality.ORIGINAL && 
          options.maxWidth === ImageSize.ORIGINAL && options.maxHeight === ImageSize.ORIGINAL) {
        return uri;
      }
      
      // Get image info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }
      
      // Check if file is too large and needs compression
      const needsCompression = options.compress && 
                              fileInfo.size && 
                              fileInfo.size > MAX_FILE_SIZE;
      
      // Prepare manipulation actions
      const actions: ImageManipulator.Action[] = [];
      
      // Add resize action if needed
      if (options.maxWidth !== ImageSize.ORIGINAL || options.maxHeight !== ImageSize.ORIGINAL) {
        actions.push({
          resize: {
            width: options.maxWidth || undefined,
            height: options.maxHeight || undefined
          }
        });
      }
      
      // Process the image
      const processedImage = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
          compress: needsCompression ? 
                    Math.min(options.quality || ImageQuality.HIGH, ImageQuality.MEDIUM) : 
                    options.quality || ImageQuality.HIGH,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );
      
      return processedImage.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      // Return original URI if processing fails
      return uri;
    }
  }
  
  /**
   * Generate a thumbnail from an image
   * @param uri Image URI
   * @param size Thumbnail size
   * @returns Promise resolving to the thumbnail URI
   */
  async generateThumbnail(uri: string, size: number = 150): Promise<string> {
    try {
      const thumbnail = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: size, height: size } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return thumbnail.uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get the current user ID or throw an error if not authenticated
   * @returns User ID
   */
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }
    
    return user.uid;
  }
  
  /**
   * Get the storage path for an image type
   * @param type Image type
   * @param userId User ID
   * @param id Optional ID (post ID, event ID, etc.)
   * @returns Storage path
   */
  private getStoragePath(type: ImageType, userId: string, id?: string): string {
    switch (type) {
      case ImageType.PROFILE:
        return `profile_images/${userId}`;
      case ImageType.POST:
        return id ? `posts/${userId}/${id}` : `posts/${userId}`;
      case ImageType.EVENT:
        return id ? `events/${userId}/${id}` : `events/${userId}`;
      case ImageType.EVENT_SPEAKER:
        return id ? `events/${userId}/${id}/speakers` : `events/${userId}/speakers`;
      case ImageType.TEST:
        return `test_uploads/${userId}`;
      default:
        return `uploads/${userId}`;
    }
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
    try {
      if (!uri) {
        throw new Error('Image URI is required');
      }
      
      // Get current user ID
      const userId = this.getCurrentUserId();
      
      // Merge options with defaults
      const mergedOptions: ImageUploadOptions = {
        ...DEFAULT_OPTIONS[type],
        ...options
      };
      
      // Process image
      const processedUri = await this.processImage(uri, mergedOptions);
      
      // Generate thumbnail if needed
      let thumbnailUri: string | undefined;
      if (mergedOptions.generateThumbnail) {
        thumbnailUri = await this.generateThumbnail(
          processedUri,
          mergedOptions.thumbnailSize || 150
        );
      }
      
      // Get storage path
      const path = this.getStoragePath(type, userId, id);
      
      // Create unique filenames
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const filename = `${timestamp}_${randomString}.jpg`;
      const thumbnailFilename = thumbnailUri ? `${timestamp}_${randomString}_thumb.jpg` : undefined;
      
      // Prepare storage options
      const storageOptions: StorageUploadOptions = {
        contentType: 'image/jpeg',
        customMetadata: mergedOptions.metadata,
        maxRetries: 3,
        onProgress: mergedOptions.onProgress
      };
      
      // Upload main image
      const mainImageResult = await firebaseStorageRepository.uploadFile(
        `${path}/${filename}`,
        processedUri,
        storageOptions
      );
      
      // Upload thumbnail if available
      let thumbnailUrl: string | undefined;
      if (thumbnailUri && thumbnailFilename) {
        try {
          const thumbnailResult = await firebaseStorageRepository.uploadFile(
            `${path}/${thumbnailFilename}`,
            thumbnailUri,
            storageOptions
          );
          thumbnailUrl = thumbnailResult.url;
        } catch (thumbnailError) {
          console.error('Error uploading thumbnail:', thumbnailError);
          // Continue without thumbnail
        }
      }
      
      return {
        url: mainImageResult.url,
        thumbnailUrl
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
          
          // Upload the image
          const result = await this.uploadImage(
            imageUris[i],
            ImageType.POST,
            {
              onProgress: individualProgress
            },
            postId
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
    try {
      const result = await this.uploadImage(uri, ImageType.PROFILE, options);
      return result.url;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
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
    try {
      return await this.uploadImage(uri, ImageType.POST, options, postId);
    } catch (error) {
      console.error('Error uploading post image:', error);
      throw error;
    }
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
    try {
      return await this.uploadImage(uri, ImageType.EVENT, options, eventId);
    } catch (error) {
      console.error('Error uploading event image:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const imageService = new ImageService();