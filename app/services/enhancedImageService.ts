// app/services/enhancedImageService.ts
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL, StorageError } from 'firebase/storage';
import { auth } from '../../lib/firebaseConfig';

/**
 * Image quality settings
 */
export enum ImageQuality {
  LOW = 0.3,
  MEDIUM = 0.6,
  HIGH = 0.9,
  ORIGINAL = 1.0
}

/**
 * Image size settings
 */
export enum ImageSize {
  SMALL = 500,
  MEDIUM = 1000,
  LARGE = 2000,
  ORIGINAL = 0 // No resizing
}

/**
 * Image type definitions
 */
export enum ImageType {
  PROFILE = 'profile',
  POST = 'post',
  EVENT = 'event',
  EVENT_SPEAKER = 'event_speaker',
  TEST = 'test'
}

/**
 * Image upload options
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
 * Maximum retry attempts for uploads
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay between retry attempts (in ms)
 */
const RETRY_DELAY = 1000;

/**
 * Enhanced Image Service
 * Provides a unified interface for all image operations with improved error handling,
 * image optimization, and consistent path structure
 */
class EnhancedImageService {
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
   * Normalize a file URI to ensure compatibility across platforms
   * @param uri The original URI from image picker or camera
   * @returns Normalized URI that works with fetch
   */
  private normalizeUri(uri: string | null): string {
    if (!uri) return '';
    
    // Handle different URI formats based on platform
    if (Platform.OS === 'ios') {
      // On iOS, ensure the URI has the file:// prefix for local files
      if (uri.startsWith('file://')) {
        return uri;
      } else if (!uri.startsWith('http') && !uri.startsWith('data:')) {
        // Add file:// prefix if it's missing and not a remote URL or data URI
        return `file://${uri}`;
      }
    } else if (Platform.OS === 'android') {
      // On Android, file:// is usually not needed, but let's ensure it's properly formatted
      if (uri.startsWith('content://') || uri.startsWith('/') || uri.startsWith('file:')) {
        return uri;
      }
    }
    
    // Return as is for web or if already properly formatted
    return uri;
  }
  
  /**
   * Create a blob from a file URI with improved error handling
   * @param uri Normalized file URI
   * @returns Promise resolving to a Blob
   */
  private async createBlobFromUri(uri: string): Promise<Blob> {
    try {
      // For data URIs, convert directly to blob without fetch
      if (uri.startsWith('data:')) {
        return await (await fetch(uri)).blob();
      }
      
      // Standard fetch approach for file URIs and remote URLs
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify blob was created successfully
      if (!blob || blob.size === 0) {
        throw new Error('Created blob is empty or invalid');
      }
      
      return blob;
    } catch (error) {
      console.error('Error creating blob:', error);
      throw new Error(`Failed to create blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   * @param id Optional ID (post ID, event ID, etc.)
   * @returns Storage path
   */
  private getStoragePath(type: ImageType, id?: string): string {
    const userId = this.getCurrentUserId();
    
    switch (type) {
      case ImageType.PROFILE:
        return `profile_images`;
      case ImageType.POST:
        return `posts/${userId}`;
      case ImageType.EVENT:
        // For events, we don't include the event ID in the path to match storage rules
        return `events/${userId}`;
      case ImageType.EVENT_SPEAKER:
        // For event speakers, we don't include the event ID in the path to match storage rules
        return `events/${userId}`;
      case ImageType.TEST:
        return `test_uploads/${userId}`;
      default:
        return `uploads/${userId}`;
    }
  }
  
  /**
   * Upload an image to Firebase Storage with retry mechanism and progress tracking
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
    metadata?: Record<string, string>;
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
      
      // Normalize URI
      const normalizedUri = this.normalizeUri(uri);
      
      // Process image
      const processedUri = await this.processImage(normalizedUri, mergedOptions);
      
      // Generate thumbnail if needed
      let thumbnailUri: string | undefined;
      if (mergedOptions.generateThumbnail) {
        thumbnailUri = await this.generateThumbnail(
          processedUri,
          mergedOptions.thumbnailSize || 150
        );
      }
      
      // Get storage path
      const path = this.getStoragePath(type, id);
      // Create unique filenames
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      // Include the ID in the filename instead of the path
      const idPrefix = id ? `${id}_` : '';
      const filename = `${idPrefix}${timestamp}_${randomString}.jpg`;
      const thumbnailFilename = thumbnailUri ? `${idPrefix}${timestamp}_${randomString}_thumb.jpg` : undefined;
      
      // Initialize storage
      const storage = getStorage();
      
      // Upload main image
      const imageRef = ref(storage, `${path}/${filename}`);
      const imageBlob = await this.createBlobFromUri(processedUri);
      
      // Track upload progress
      let uploadProgress = 0;
      const updateProgress = (progress: number) => {
        uploadProgress = progress;
        if (mergedOptions.onProgress) {
          mergedOptions.onProgress(thumbnailUri ? progress * 0.7 : progress);
        }
      };
      
      // Upload with retry
      const uploadWithRetry = async (attempt: number = 0): Promise<string> => {
        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            if (uploadProgress < 0.9) {
              uploadProgress += 0.1;
              if (mergedOptions.onProgress) {
                mergedOptions.onProgress(thumbnailUri ? uploadProgress * 0.7 : uploadProgress);
              }
            }
          }, 500);
          
          // Upload image
          const uploadResult = await uploadBytes(imageRef, imageBlob, {
            customMetadata: mergedOptions.metadata
          });
          
          // Clear progress interval
          clearInterval(progressInterval);
          
          // Get download URL
          const downloadURL = await getDownloadURL(imageRef);
          return downloadURL;
        } catch (error) {
          console.error(`Upload attempt ${attempt + 1} failed:`, error);
          
          // Check if we should retry
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            console.log(`Retrying upload in ${RETRY_DELAY/1000} seconds...`);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            
            // Try again
            return uploadWithRetry(attempt + 1);
          }
          
          throw error;
        }
      };
      
      // Upload main image
      const imageUrl = await uploadWithRetry();
      
      // Upload thumbnail if available
      let thumbnailUrl: string | undefined;
      if (thumbnailUri && thumbnailFilename) {
        try {
          const thumbnailRef = ref(storage, `${path}/${thumbnailFilename}`);
          const thumbnailBlob = await this.createBlobFromUri(thumbnailUri);
          
          // Update progress for thumbnail upload
          if (mergedOptions.onProgress) {
            mergedOptions.onProgress(0.7); // Main image is 70% of progress
          }
          
          await uploadBytes(thumbnailRef, thumbnailBlob);
          thumbnailUrl = await getDownloadURL(thumbnailRef);
          
          // Complete progress
          if (mergedOptions.onProgress) {
            mergedOptions.onProgress(1.0);
          }
        } catch (thumbnailError) {
          console.error('Error uploading thumbnail:', thumbnailError);
          // Continue without thumbnail
        }
      } else if (mergedOptions.onProgress) {
        // Complete progress if no thumbnail
        mergedOptions.onProgress(1.0);
      }
      
      return {
        url: imageUrl,
        thumbnailUrl,
        metadata: mergedOptions.metadata
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Provide detailed error information
      if (error instanceof StorageError) {
        console.error(`Firebase Storage error code: ${error.code}`);
        console.error(`Firebase Storage error message: ${error.message}`);
        
        // Handle specific Firebase Storage errors
        switch (error.code) {
          case 'storage/unauthorized':
            throw new Error('You do not have permission to upload this image');
          case 'storage/canceled':
            throw new Error('Upload was canceled');
          case 'storage/unknown':
            throw new Error('An unknown error occurred during upload');
          case 'storage/quota-exceeded':
            throw new Error('Storage quota exceeded. Please try a smaller image');
          default:
            throw new Error(`Upload failed: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const result = await this.uploadImage(uri, ImageType.POST, options, postId);
      return {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl
      };
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
      const result = await this.uploadImage(uri, ImageType.EVENT, options, eventId);
      return {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl
      };
    } catch (error) {
      console.error('Error uploading event image:', error);
      throw error;
    }
  }
  
  /**
   * Upload a speaker image for an event
   * @param uri Image URI
   * @param eventId Event ID
   * @param options Upload options
   * @returns Promise resolving to the speaker image URL
   */
  async uploadEventSpeakerImage(
    uri: string,
    eventId: string,
    options?: Partial<ImageUploadOptions>
  ): Promise<string> {
    try {
      if (!eventId) {
        throw new Error('Event ID is required for speaker image upload');
      }
      
      const result = await this.uploadImage(uri, ImageType.EVENT_SPEAKER, options, eventId);
      return result.url;
    } catch (error) {
      console.error('Error uploading speaker image:', error);
      throw error;
    }
  }
  
  /**
   * Upload a test image
   * @param uri Image URI
   * @param options Upload options
   * @returns Promise resolving to the test image URL
   */
  async uploadTestImage(
    uri: string,
    options?: Partial<ImageUploadOptions>
  ): Promise<string> {
    try {
      const result = await this.uploadImage(uri, ImageType.TEST, options);
      return result.url;
    } catch (error) {
      console.error('Error uploading test image:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const enhancedImageService = new EnhancedImageService();