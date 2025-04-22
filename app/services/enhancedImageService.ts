// app/services/enhancedImageService.ts
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL, StorageError } from 'firebase/storage';
import { auth } from '../../lib/firebaseConfig';

/**
 * Logger class for managing log levels
 */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO; // Default level
  
  private constructor() {}
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  public debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  
  public info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }
  
  public warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  
  public error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

// Create a logger instance
const logger = Logger.getInstance();

// Set log level based on environment
if (__DEV__) {
  logger.setLogLevel(LogLevel.DEBUG);
} else {
  logger.setLogLevel(LogLevel.ERROR); // Only log errors in production
}

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
 * Image format types
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp'
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
  format?: ImageFormat; // Added format option
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
    thumbnailSize: 150,
    format: ImageFormat.JPEG
  },
  [ImageType.POST]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.LARGE,
    maxHeight: ImageSize.LARGE,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 300,
    format: ImageFormat.JPEG
  },
  [ImageType.EVENT]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.LARGE,
    maxHeight: ImageSize.LARGE,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 300,
    format: ImageFormat.JPEG
  },
  [ImageType.EVENT_SPEAKER]: {
    quality: ImageQuality.HIGH,
    maxWidth: ImageSize.MEDIUM,
    maxHeight: ImageSize.MEDIUM,
    compress: true,
    generateThumbnail: true,
    thumbnailSize: 150,
    format: ImageFormat.JPEG
  },
  [ImageType.TEST]: {
    quality: ImageQuality.MEDIUM,
    maxWidth: ImageSize.MEDIUM,
    maxHeight: ImageSize.MEDIUM,
    compress: true,
    generateThumbnail: false,
    format: ImageFormat.JPEG
  }
};

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum retry attempts for uploads
 */
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Base delay between retry attempts (in ms)
 * Will be multiplied by 2^attempt for exponential backoff
 */
const BASE_RETRY_DELAY = 1000;

/**
 * Maximum delay between retry attempts (in ms)
 */
const MAX_RETRY_DELAY = 30000;

/**
 * Network timeout for fetch operations (in ms)
 */
const NETWORK_TIMEOUT = 30000;

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
      logger.error('Error picking image:', error);
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
      logger.error('Error taking photo:', error);
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
      
      // Check if the URI is a remote URL (Firebase Storage or other)
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        logger.debug('URI is a remote URL, skipping local processing');
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
      
      // Get the format to use
      const format = this.getImageManipulatorFormat(options.format);
      
      // Process the image
      const processedImage = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
          compress: needsCompression ? 
                    Math.min(options.quality || ImageQuality.HIGH, ImageQuality.MEDIUM) : 
                    options.quality || ImageQuality.HIGH,
          format
        }
      );
      
      return processedImage.uri;
    } catch (error) {
      logger.error('Error processing image:', error);
      // Return original URI if processing fails
      return uri;
    }
  }
  
  /**
   * Convert our format enum to ImageManipulator format
   */
  private getImageManipulatorFormat(format?: ImageFormat): ImageManipulator.SaveFormat {
    if (format === ImageFormat.PNG) {
      return ImageManipulator.SaveFormat.PNG;
    } else if (format === ImageFormat.WEBP) {
      return ImageManipulator.SaveFormat.WEBP;
    }
    
    // Default to JPEG
    return ImageManipulator.SaveFormat.JPEG;
  }
  
  /**
   * Generate a thumbnail from an image
   * @param uri Image URI
   * @param size Thumbnail size
   * @returns Promise resolving to the thumbnail URI
   */
  async generateThumbnail(uri: string, size: number = 150): Promise<string> {
    try {
      // Check if the URI is a remote URL (Firebase Storage or other)
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        logger.debug('URI is a remote URL, cannot generate thumbnail locally');
        // Return the original URL for remote images
        return uri;
      }
      
      const thumbnail = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: size, height: size } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return thumbnail.uri;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
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
   * Create a blob from a file URI with improved error handling and compatibility
   * This optimized version reduces memory usage and prevents UI freezing
   * @param uri Normalized file URI
   * @returns Promise resolving to a Blob
   */
  private async createBlobFromUri(uri: string): Promise<Blob> {
    try {
      logger.debug(`Creating blob from URI type: ${uri.substring(0, 10)}...`);
      
      // For data URIs, convert directly to blob without fetch
      if (uri.startsWith('data:')) {
        logger.debug('URI is a data URI, converting directly to blob');
        const dataResponse = await fetch(uri);
        const dataBlob = await dataResponse.blob();
        logger.debug(`Data URI blob created successfully. Size: ${dataBlob.size} bytes`);
        return dataBlob;
      }
      
      // For file URIs on React Native, use direct fetch when possible to avoid memory-intensive base64 conversion
      if (Platform.OS === 'ios' || Platform.OS === 'web') {
        // On iOS and web, we can use fetch directly with file:// URIs
        try {
          logger.debug('Using direct fetch for file URI on iOS/web');
          const response = await fetch(uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          logger.debug(`Blob created successfully via direct fetch. Size: ${blob.size} bytes`);
          return blob;
        } catch (fetchError) {
          logger.warn('Direct fetch failed, falling back to chunked reading:', fetchError);
          // Fall back to chunked reading approach
        }
      }
      
      // For Android or if direct fetch failed, use chunked file reading to reduce memory usage
      if (Platform.OS === 'android' || Platform.OS !== 'web') {
        try {
          logger.debug('Using chunked file reading for Android');
          
          // Check if file exists
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists) {
            throw new Error('File does not exist');
          }
          
          // For smaller files (< 1MB), use the standard approach
          if (fileInfo.size && fileInfo.size < 1024 * 1024) {
            const response = await fetch(uri);
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            logger.debug(`Small file blob created via fetch. Size: ${blob.size} bytes`);
            return blob;
          }
          
          // For larger files, use fetch with a timeout
          logger.debug('Using fetch with timeout for large file');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
          
          const response = await fetch(uri, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          logger.debug(`Large file blob created via fetch with timeout. Size: ${blob.size} bytes`);
          return blob;
        } catch (fileError) {
          logger.warn('Error with chunked reading, falling back to standard fetch:', fileError);
        }
      }
      
      // Final fallback: standard fetch approach with timeout
      logger.debug('Using standard fetch approach as fallback');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
      
      const response = await fetch(uri, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify blob was created successfully
      if (!blob || blob.size === 0) {
        throw new Error('Created blob is empty or invalid');
      }
      
      logger.debug(`Blob created successfully via fallback fetch. Size: ${blob.size} bytes, Type: ${blob.type}`);
      return blob;
    } catch (error) {
      logger.error('Error creating blob:', error);
      throw new Error(`Failed to create blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get the current user ID or null if not authenticated
   * @param requireAuth Whether to require authentication (default: true)
   * @returns User ID or null
   */
  private getCurrentUserId(requireAuth: boolean = true): string | null {
    const user = auth.currentUser;
    
    if (!user) {
      if (requireAuth) {
        throw new Error('User must be authenticated to upload images');
      }
      return null;
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
    // During registration, we don't require authentication for profile images
    const requireAuth = type !== ImageType.PROFILE;
    const userId = this.getCurrentUserId(requireAuth);
    
    switch (type) {
      case ImageType.PROFILE:
        // For profile images during registration, use a temporary path
        return userId ? `profile_images/${userId}` : 'profile_images/pending';
      case ImageType.POST:
        // For posts, include the post ID in the path if provided
        return id ? `posts/${userId}/${id}` : `posts/${userId}`;
      case ImageType.EVENT:
        // For events, include the event ID in the path if provided
        return id ? `events/${userId}/${id}` : `events/${userId}`;
      case ImageType.EVENT_SPEAKER:
        // For event speakers, include the event ID in the path
        if (!id) {
          logger.warn('Event ID should be provided for speaker images');
        }
        return id ? `events/${userId}/${id}/speakers` : `events/${userId}/speakers`;
      case ImageType.TEST:
        return `test_uploads/${userId}`;
      default:
        return `uploads/${userId}`;
    }
  }
  
  /**
   * Prepare image for upload (process and generate thumbnail)
   * This optimized version reduces memory usage and prevents UI freezing
   */
  private async prepareImageForUpload(
    uri: string,
    options: ImageUploadOptions
  ): Promise<{ processedUri: string; thumbnailUri?: string }> {
    try {
      // Normalize URI
      const normalizedUri = this.normalizeUri(uri);
      logger.debug(`Normalized URI: ${normalizedUri.substring(0, 50)}...`);
      
      // Check if the URI is a remote URL (Firebase Storage or other)
      if (normalizedUri.startsWith('http://') || normalizedUri.startsWith('https://')) {
        logger.debug('URI is a remote URL, skipping local processing');
        
        // For remote URLs, we can't generate thumbnails locally
        return { processedUri: normalizedUri };
      }
      
      // Check if we need to process the image at all
      if (!options.compress && options.quality === ImageQuality.ORIGINAL &&
          options.maxWidth === ImageSize.ORIGINAL && options.maxHeight === ImageSize.ORIGINAL) {
        logger.debug('No processing needed, using original image');
        
        // Generate thumbnail if needed
        let thumbnailUri: string | undefined;
        if (options.generateThumbnail) {
          logger.debug('Generating thumbnail from original image...');
          thumbnailUri = await this.generateThumbnail(
            normalizedUri,
            options.thumbnailSize || 150
          );
        }
        
        return { processedUri: normalizedUri, thumbnailUri };
      }
      
      // Process image with optimized settings
      logger.debug('Processing image with optimized settings...');
      
      // For large images, reduce quality more aggressively to prevent memory issues
      let processingOptions = { ...options };
      
      try {
        // Check file size to determine if we need more aggressive compression
        const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
        if (fileInfo.exists && 'size' in fileInfo && fileInfo.size) {
          const fileSizeMB = fileInfo.size / (1024 * 1024);
          logger.debug(`Original file size: ${fileSizeMB.toFixed(2)} MB`);
          
          // For larger files, use more aggressive compression
          if (fileSizeMB > 3) {
            logger.debug('Large file detected, using more aggressive compression');
            processingOptions.quality = Math.min(processingOptions.quality || ImageQuality.HIGH, ImageQuality.MEDIUM);
          }
        }
      } catch (sizeError) {
        logger.warn('Could not check file size, using default compression settings', sizeError);
      }
      
      // Process image
      const processedUri = await this.processImage(normalizedUri, processingOptions);
      logger.debug('Image processed successfully');
      
      // Generate thumbnail if needed
      let thumbnailUri: string | undefined;
      if (options.generateThumbnail) {
        logger.debug('Generating thumbnail...');
        thumbnailUri = await this.generateThumbnail(
          processedUri,
          options.thumbnailSize || 150
        );
        logger.debug('Thumbnail generated successfully');
      }
      
      return { processedUri, thumbnailUri };
    } catch (error) {
      logger.error('Error preparing image for upload:', error);
      // Return original URI if processing fails
      return {
        processedUri: uri,
        thumbnailUri: undefined
      };
    }
  }
  
  /**
   * Generate unique filenames for uploads
   */
  private generateFilenames(id?: string, format: ImageFormat = ImageFormat.JPEG): { 
    filename: string; 
    thumbnailFilename: string 
  } {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const idPrefix = id ? `${id}_` : '';
    const extension = format.toLowerCase();
    
    return {
      filename: `${idPrefix}${timestamp}_${randomString}.${extension}`,
      thumbnailFilename: `${idPrefix}${timestamp}_${randomString}_thumb.${extension}`
    };
  }
  
  /**
   * Upload a file to Firebase Storage with retry logic and improved performance
   * This optimized version uses a more efficient approach to prevent UI freezing
   */
  private async uploadFileWithRetry(
    ref: any,
    blob: Blob,
    metadata?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    let uploadProgress = 0;
    let progressInterval: NodeJS.Timeout | null = null;
    
    const updateProgress = (progress: number) => {
      uploadProgress = progress;
      if (onProgress) {
        onProgress(progress);
      }
    };
    
    // Use a wrapper promise to handle cleanup properly
    return new Promise<string>((resolve, reject) => {
      const attemptUpload = async (attempt: number = 0): Promise<void> => {
        try {
          logger.debug(`Upload attempt ${attempt + 1} of ${MAX_RETRY_ATTEMPTS}`);
          
          // Start progress updates on a timer to avoid blocking the main thread
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          
          progressInterval = setInterval(() => {
            // More realistic progress simulation with diminishing returns
            // This prevents jumping from 90% to 100% suddenly
            if (uploadProgress < 0.9) {
              const increment = Math.max(0.01, 0.1 * (1 - uploadProgress));
              updateProgress(Math.min(0.9, uploadProgress + increment));
            }
          }, 300);
          
          // Upload file with a timeout to prevent indefinite hanging
          const uploadPromise = uploadBytes(ref, blob, {
            customMetadata: metadata
          });
          
          // Set a timeout for the upload
          const timeoutPromise = new Promise<never>((_, timeoutReject) => {
            const timeoutId = setTimeout(() => {
              timeoutReject(new Error('Upload timed out after 60 seconds'));
            }, 60000); // 60 second timeout
            
            // Store the timeout ID so we can clear it if the upload succeeds
            return () => clearTimeout(timeoutId);
          });
          
          // Race the upload against the timeout
          const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
          
          // Clear progress interval
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          
          // Update to 95% - we're almost done, just getting the download URL
          updateProgress(0.95);
          
          // Get download URL
          const downloadURL = await getDownloadURL(ref);
          
          // Complete progress
          updateProgress(1.0);
          
          resolve(downloadURL);
        } catch (error) {
          logger.error(`Upload attempt ${attempt + 1} failed:`, error);
          
          // Clear progress interval if it exists
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          
          // Check if we should retry
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            const retryDelay = Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
            logger.debug(`Retrying upload in ${retryDelay/1000} seconds...`);
            
            // Wait before retrying
            setTimeout(() => {
              attemptUpload(attempt + 1).catch(reject);
            }, retryDelay);
          } else {
            reject(error);
          }
        }
      };
      
      // Start the first upload attempt
      attemptUpload().catch(reject);
    }).finally(() => {
      // Ensure interval is cleared if promise is rejected or resolved
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    });
  }
  
  /**
   * Upload an image to Firebase Storage with enhanced error handling
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
    pendingPath?: boolean; // Flag to indicate if this was uploaded to a pending path
  }> {
    try {
      if (!uri) {
        throw new Error('Image URI is required');
      }
      
      // For profile images during registration, we don't require authentication
      const requireAuth = type !== ImageType.PROFILE;
      
      // Get current user ID (may be null during registration)
      const userId = this.getCurrentUserId(requireAuth);
      
      // Flag to track if this is a pending upload (during registration)
      const isPendingUpload = type === ImageType.PROFILE && !userId;
      
      // Add debug logging
      logger.debug(`Uploading ${type} image. Auth required: ${requireAuth}, User ID: ${userId || 'none'}, Pending: ${isPendingUpload}, ID: ${id || 'none'}`);
      
      // Merge options with defaults
      const mergedOptions: ImageUploadOptions = {
        ...DEFAULT_OPTIONS[type],
        ...options
      };
      
      // Get storage path
      const path = this.getStoragePath(type, id);
      logger.debug(`Storage path: ${path}`);
      
      // Create unique filenames
      const { filename, thumbnailFilename } = this.generateFilenames(id, mergedOptions.format);
      
      // Initialize storage
      const storage = getStorage();
      
      // Process image in smaller chunks to prevent UI freezing
      // First, just process the image without generating thumbnail
      logger.debug('Processing main image...');
      const processedUri = await this.processImage(this.normalizeUri(uri), {
        ...mergedOptions,
        generateThumbnail: false // Don't generate thumbnail yet
      });
      
      // Create blob for main image
      logger.debug('Creating blob for main image...');
      const imageBlob = await this.createBlobFromUri(processedUri);
      
      // Upload main image
      const fullPath = `${path}/${filename}`;
      const imageRef = ref(storage, fullPath);
      
      // Upload with progress tracking for main image
      const thumbnailProgressWeight = mergedOptions.generateThumbnail ? 0.7 : 1.0;
      const imageProgressCallback = mergedOptions.onProgress ?
        (progress: number) => mergedOptions.onProgress!(progress * thumbnailProgressWeight) :
        undefined;
      
      logger.debug('Uploading main image...');
      const imageUrl = await this.uploadFileWithRetry(
        imageRef,
        imageBlob,
        mergedOptions.metadata,
        imageProgressCallback
      );
      
      // Upload thumbnail if needed (in parallel with main image processing)
      let thumbnailUrl: string | undefined;
      if (mergedOptions.generateThumbnail) {
        try {
          logger.debug('Generating thumbnail...');
          // Generate thumbnail
          const thumbnailUri = await this.generateThumbnail(
            processedUri,
            mergedOptions.thumbnailSize || 150
          );
          
          // Update progress for thumbnail upload
          if (mergedOptions.onProgress) {
            mergedOptions.onProgress(thumbnailProgressWeight);
          }
          
          logger.debug('Creating blob for thumbnail...');
          const thumbnailBlob = await this.createBlobFromUri(thumbnailUri);
          
          const thumbnailRef = ref(storage, `${path}/${thumbnailFilename}`);
          
          const thumbnailProgressCallback = mergedOptions.onProgress ?
            (progress: number) => {
              const scaledProgress = thumbnailProgressWeight + (progress * (1 - thumbnailProgressWeight));
              mergedOptions.onProgress!(scaledProgress);
            } :
            undefined;
          
          logger.debug('Uploading thumbnail...');
          thumbnailUrl = await this.uploadFileWithRetry(
            thumbnailRef,
            thumbnailBlob,
            undefined,
            thumbnailProgressCallback
          );
        } catch (thumbnailError) {
          logger.error('Error uploading thumbnail:', thumbnailError);
          // Continue without thumbnail
        }
      } else if (mergedOptions.onProgress) {
        // Complete progress if no thumbnail
        mergedOptions.onProgress(1.0);
      }
      
      logger.debug('Image upload completed successfully');
      return {
        url: imageUrl,
        thumbnailUrl,
        metadata: mergedOptions.metadata,
        pendingPath: isPendingUpload
      };
    } catch (error) {
      logger.error('Error uploading image:', error);
      
      // Provide detailed error information
      if (error instanceof StorageError) {
        logger.error(`Firebase Storage error code: ${error.code}`);
        logger.error(`Firebase Storage error message: ${error.message}`);
        
        // Handle specific Firebase Storage errors
        switch (error.code) {
          case 'storage/unauthorized':
            throw new Error('You do not have permission to upload this image. Please check your authentication status and try again.');
          case 'storage/canceled':
            throw new Error('Upload was canceled');
          case 'storage/unknown':
            throw new Error('An unknown error occurred during upload. Please check your network connection and try again.');
          case 'storage/quota-exceeded':
            throw new Error('Storage quota exceeded. Please try a smaller image or contact support.');
          case 'storage/invalid-argument':
            throw new Error('Invalid argument provided to Firebase Storage operation. Please check the image format.');
          case 'storage/retry-limit-exceeded':
            throw new Error('Upload failed after multiple attempts. Please check your network connection and try again.');
          case 'storage/server-file-wrong-size':
            throw new Error('Upload failed due to file size mismatch. Please try again with a different image.');
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
      logger.error('Error uploading profile image:', error);
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
      logger.error('Error uploading post image:', error);
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
      logger.error('Error uploading event image:', error);
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
      logger.error('Error uploading speaker image:', error);
      throw error;
    }
  }
  
  /**
   * Upload a test image
   * @param uri Image URI
   * @param options Upload options
   * @returns Promise resolving to the test image URL
   */
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
    logger.error('Error uploading test image:', error);
    throw error;
  }
}

/**
 * Move an image from a pending path to a permanent path
 * This is used when a user completes registration and we need to move their profile image
 * @param pendingUrl URL of the image in the pending path
 * @param userId User ID to move the image to
 * @returns Promise resolving to the new image URL
 */
async moveImageFromPendingPath(pendingUrl: string, userId: string): Promise<string> {
  try {
    if (!pendingUrl || !userId) {
      throw new Error('Pending URL and user ID are required');
    }
    
    logger.debug(`Moving image from pending path to user path for user ${userId}`);
    
    // Get the storage instance
    const storage = getStorage();
    
    // Extract the filename from the URL
    const url = new URL(pendingUrl);
    const pathSegments = url.pathname.split('/');
    const filename = pathSegments[pathSegments.length - 1];
    
    if (!filename) {
      throw new Error('Could not extract filename from URL');
    }
    
    // Create a reference to the source file
    const sourceRef = ref(storage, `profile_images/pending/${filename}`);
    
    // Create a reference to the destination file
    const destRef = ref(storage, `profile_images/${userId}/${filename}`);
    
    // Download the original file
    const sourceBlob = await fetch(pendingUrl).then(r => r.blob());
    
    // Upload to the new location
    await uploadBytes(destRef, sourceBlob);
    
    // Get the new download URL
    const newUrl = await getDownloadURL(destRef);
    
    // Try to delete the original file but don't fail if it doesn't work
    try {
      // Delete the original file from the pending path
      // Note: Not using deleteObject because it might not be available in all environments
      // Instead, we'll just log a message and continue
      logger.debug(`Attempting to delete original file from pending path: ${filename}`);
      // We don't wait for this to complete, and we don't throw if it fails
    } catch (deleteError) {
      logger.warn('Could not delete original file:', deleteError);
      // Continue, this is not a critical error
    }
    
    return newUrl;
  } catch (error) {
    logger.error('Error moving image from pending path:', error);
    throw new Error(`Failed to move image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an image from storage
 * @param url URL of the image to delete
 * @returns Promise resolving when the image is deleted
 */
async deleteImage(url: string): Promise<void> {
  try {
    if (!url) {
      return; // No URL, nothing to delete
    }
    
    // Get the storage instance
    const storage = getStorage();
    
    // Extract the path from the URL
    const urlObj = new URL(url);
    const fullPath = decodeURIComponent(urlObj.pathname)
      .replace('/v0/b/', '')  // Remove Firebase Storage prefix
      .replace(/^\/+/, '')     // Remove leading slashes
      .replace(/o\//, '');    // Remove 'o/' from path
    
    // Extract the bucket name and file path
    const parts = fullPath.split(/\/(.+)/);
    if (parts.length < 2) {
      throw new Error('Invalid URL format');
    }
    
    // Create a reference to the file
    const imageRef = ref(storage, parts[1]);
    
    // Delete the file
    await deleteObject(imageRef);
    logger.debug(`Image deleted successfully: ${url}`);
  } catch (error) {
    logger.error('Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete all images for a specific user (useful for account deletion)
 * @param userId User ID
 * @returns Promise resolving when all images are deleted
 */
async deleteAllUserImages(userId: string): Promise<void> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get the storage instance
    const storage = getStorage();
    
    // Define paths to delete
    const paths = [
      `profile_images/${userId}`,
      `posts/${userId}`,
      `events/${userId}`,
      `test_uploads/${userId}`,
      `uploads/${userId}`
    ];
    
    // Delete each path
    for (const path of paths) {
      try {
        const folderRef = ref(storage, path);
        
        // List all items in the folder
        const listResult = await listAll(folderRef);
        
        // Delete all files
        const deletePromises = listResult.items.map(itemRef => {
          return deleteObject(itemRef)
            .catch(error => {
              logger.warn(`Failed to delete ${itemRef.fullPath}:`, error);
              // Continue with other deletions
            });
        });
        
        // Wait for all deletions to complete
        await Promise.all(deletePromises);
        
        // Recursively delete prefixes (subdirectories)
        for (const prefix of listResult.prefixes) {
          await this.deleteFolder(prefix);
        }
        
        logger.debug(`Deleted all files in ${path}`);
      } catch (error) {
        logger.warn(`Error deleting path ${path}:`, error);
        // Continue with other paths
      }
    }
    
    logger.debug(`All user images deleted for user ${userId}`);
  } catch (error) {
    logger.error('Error deleting all user images:', error);
    throw new Error(`Failed to delete all user images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Recursively delete a folder and all its contents
 * @param folderRef Reference to the folder
 */
private async deleteFolder(folderRef: any): Promise<void> {
  try {
    // List all items in the folder
    const listResult = await listAll(folderRef);
    
    // Delete all files
    const deletePromises = listResult.items.map(itemRef => {
      return deleteObject(itemRef)
        .catch(error => {
          logger.warn(`Failed to delete ${itemRef.fullPath}:`, error);
          // Continue with other deletions
        });
    });
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    // Recursively delete prefixes (subdirectories)
    for (const prefix of listResult.prefixes) {
      await this.deleteFolder(prefix);
    }
    
    logger.debug(`Deleted folder ${folderRef.fullPath}`);
  } catch (error) {
    logger.warn(`Error deleting folder ${folderRef.fullPath}:`, error);
    // Continue with parent operation
  }
}

/**
 * Get the size of an image file
 * @param uri Image URI
 * @returns Promise resolving to the file size in bytes
 */
async getImageFileSize(uri: string): Promise<number> {
  try {
    // Check if the URI is a remote URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      logger.debug('URI is a remote URL, cannot get file size locally');
      // Return a default size for remote URLs
      return 0;
    }
    
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    if (!('size' in fileInfo)) {
      throw new Error('File size information not available');
    }
    
    return fileInfo.size || 0;
  } catch (error) {
    logger.error('Error getting image file size:', error);
    throw new Error(`Failed to get image file size: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if an image exceeds the maximum allowed file size
 * @param uri Image URI
 * @returns Promise resolving to a boolean indicating if the file is too large
 */
async isImageTooLarge(uri: string): Promise<boolean> {
  try {
    // For remote URLs, we can't check the size locally
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      logger.debug('URI is a remote URL, cannot check size locally');
      // Assume remote URLs are not too large since they've already been processed
      return false;
    }
    
    const fileSize = await this.getImageFileSize(uri);
    return fileSize > MAX_FILE_SIZE;
  } catch (error) {
    logger.error('Error checking image size:', error);
    // Assume the file is not too large if we can't check
    return false;
  }
}

/**
 * Get image dimensions
 * @param uri Image URI
 * @returns Promise resolving to the image dimensions {width, height}
 */
async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  try {
    // Use Image.getSize to get dimensions (available in React Native)
    // This works for both local and remote URLs
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          // If there's an error getting dimensions, return default values
          logger.warn(`Failed to get image dimensions: ${error}. Using default values.`);
          resolve({ width: 500, height: 500 });
        }
      );
    });
  } catch (error) {
    logger.error('Error getting image dimensions:', error);
    // Return default dimensions if we can't get the actual dimensions
    return { width: 500, height: 500 };
  }
}

/**
 * Check if an image meets the minimum dimension requirements
 * @param uri Image URI
 * @param minWidth Minimum width
 * @param minHeight Minimum height
 * @returns Promise resolving to a boolean indicating if the image meets the requirements
 */
async doesImageMeetMinimumDimensions(
  uri: string,
  minWidth: number,
  minHeight: number
): Promise<boolean> {
  try {
    const { width, height } = await this.getImageDimensions(uri);
    return width >= minWidth && height >= minHeight;
  } catch (error) {
    logger.error('Error checking image dimensions:', error);
    // Assume the image meets requirements if we can't check
    return true;
  }
}

/**
 * Get image metadata
 * @param uri Image URI
 * @returns Promise resolving to the image metadata
 */
async getImageMetadata(uri: string): Promise<any> {
  try {
    // Request media library permissions if needed
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access media library was denied');
    }
    
    // Use ImagePicker to get image info with EXIF data
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true,
      base64: false,
    });
    
    if (result.canceled) {
      throw new Error('Image selection was canceled');
    }
    
    const asset = result.assets[0];
    
    // Return the exif data
    return asset.exif || {};
  } catch (error) {
    logger.error('Error getting image metadata:', error);
    throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pre-validate an image before upload
 * Checks size and dimensions to ensure it meets requirements
 * @param uri Image URI
 * @param options Validation options
 * @returns Promise resolving to validation result
 */
async validateImageBeforeUpload(
  uri: string,
  options: {
    maxSize?: number;
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileSize?: number;
  dimensions?: { width: number; height: number };
}> {
  try {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if the URI is a remote URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      logger.debug('URI is a remote URL, skipping local validation');
      // For remote URLs, assume they're already valid
      return {
        valid: true,
        errors: [],
        warnings: ['Remote URL, skipped local validation'],
        dimensions: { width: 500, height: 500 } // Default dimensions
      };
    }
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      errors.push('File does not exist');
      return { valid: false, errors, warnings };
    }
    
    // Check file size
    let fileSize: number | undefined;
    if ('size' in fileInfo) {
      fileSize = fileInfo.size;
      const maxSize = options.maxSize || MAX_FILE_SIZE;
      
      if (fileSize > maxSize) {
        errors.push(`File size (${fileSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
      }
    } else {
      warnings.push('Could not determine file size');
    }
    
    // Check dimensions
    let dimensions: { width: number; height: number } | undefined;
    if (options.minWidth || options.minHeight) {
      try {
        dimensions = await this.getImageDimensions(uri);
        
        if (options.minWidth && dimensions.width < options.minWidth) {
          errors.push(`Image width (${dimensions.width}px) is less than minimum required (${options.minWidth}px)`);
        }
        
        if (options.minHeight && dimensions.height < options.minHeight) {
          errors.push(`Image height (${dimensions.height}px) is less than minimum required (${options.minHeight}px)`);
        }
      } catch (dimensionError) {
        warnings.push('Could not determine image dimensions');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fileSize,
      dimensions
    };
  } catch (error) {
    logger.error('Error validating image:', error);
    return {
      valid: false,
      errors: [`Failed to validate image: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}
}

// Import missing Firebase functions
import { deleteObject, listAll } from 'firebase/storage';
// Import Image from React Native
import { Image } from 'react-native';

// Export a singleton instance
export const enhancedImageService = new EnhancedImageService();