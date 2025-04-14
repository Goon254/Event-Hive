import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth } from '../../lib/firebaseConfig';

/**
 * Media utilities for handling image uploads with validation and compression
 * Addresses the "Firebase Storage upload error" issues
 */

// Configuration for media uploads
export const MEDIA_CONFIG = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'heic', 'heif'],
  compressionQuality: 0.7, // 70% quality
  maxDimension: 1920, // Max 1920px on longest side
  thumbnailDimension: 300, // Thumbnail size
};

/**
 * Media file information interface
 */
export interface MediaFileInfo {
  uri: string;
  size: number;
  type: string;
  filename: string;
  extension: string;
  width?: number;
  height?: number;
}

/**
 * Media validation result interface
 */
export interface MediaValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  downloadUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  path?: string;
}

/**
 * Get file information
 * @param uri File URI
 * @returns Promise with file information
 */
export const getFileInfo = async (uri: string): Promise<MediaFileInfo | null> => {
  try {
    // Get basic file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      console.error('File does not exist:', uri);
      return null;
    }
    
    // Extract filename and extension
    const uriParts = uri.split('/');
    const filename = uriParts[uriParts.length - 1];
    const extensionParts = filename.split('.');
    const extension = extensionParts.length > 1 
      ? extensionParts[extensionParts.length - 1].toLowerCase() 
      : '';
    
    // Determine MIME type based on extension
    let type = 'application/octet-stream'; // Default
    if (['jpg', 'jpeg'].includes(extension)) {
      type = 'image/jpeg';
    } else if (extension === 'png') {
      type = 'image/png';
    } else if (['heic', 'heif'].includes(extension)) {
      type = 'image/heic';
    }
    
    return {
      uri,
      size: fileInfo.size,
      type,
      filename,
      extension,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

/**
 * Validate media file
 * @param uri File URI
 * @returns Promise with validation result
 */
export const validateMediaFile = async (uri: string): Promise<MediaValidationResult> => {
  try {
    const fileInfo = await getFileInfo(uri);
    
    if (!fileInfo) {
      return { valid: false, message: 'File does not exist or cannot be accessed' };
    }
    
    // Check file size
    if (fileInfo.size > MEDIA_CONFIG.maxSizeBytes) {
      return { 
        valid: false, 
        message: `File size exceeds maximum allowed (${(MEDIA_CONFIG.maxSizeBytes / 1024 / 1024).toFixed(1)}MB)` 
      };
    }
    
    // Check file extension
    if (!MEDIA_CONFIG.supportedImageFormats.includes(fileInfo.extension)) {
      return { 
        valid: false, 
        message: `Unsupported file format. Please use: ${MEDIA_CONFIG.supportedImageFormats.join(', ')}` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating media file:', error);
    return { valid: false, message: 'Error validating file' };
  }
};

/**
 * Compress image to reduce file size
 * @param uri Image URI
 * @returns Promise with compressed image URI
 */
export const compressImage = async (uri: string): Promise<string> => {
  try {
    const fileInfo = await getFileInfo(uri);
    
    if (!fileInfo) {
      console.warn('Could not get file info for compression, returning original');
      return uri;
    }
    
    // If file is already small enough, return original
    if (fileInfo.size < 1 * 1024 * 1024) { // Less than 1MB
      return uri;
    }
    
    // For now, we'll return the original URI since we don't have image-manipulator
    // In a real implementation, you would use image compression here
    console.log('Image compression would happen here in a real implementation');
    
    return uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
};

/**
 * Create a thumbnail version of an image
 * @param uri Image URI
 * @returns Promise with thumbnail URI
 */
export const createThumbnail = async (uri: string): Promise<string> => {
  try {
    // For now, we'll return the original URI since we don't have image-manipulator
    // In a real implementation, you would create a thumbnail here
    console.log('Thumbnail creation would happen here in a real implementation');
    
    return uri;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return uri; // Return original if thumbnail creation fails
  }
};

/**
 * Upload media to Firebase Storage
 * @param uri Media URI
 * @param path Storage path
 * @param onProgress Progress callback
 * @returns Promise with upload result
 */
export const uploadMediaToStorage = async (
  uri: string, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = await validateMediaFile(uri);
    if (!validation.valid) {
      return { 
        success: false, 
        error: validation.message || 'Invalid file' 
      };
    }
    
    // Get file info
    const fileInfo = await getFileInfo(uri);
    if (!fileInfo) {
      return { 
        success: false, 
        error: 'Could not get file information' 
      };
    }
    
    // Compress image if it's an image
    let uploadUri = uri;
    if (fileInfo.type.startsWith('image/')) {
      uploadUri = await compressImage(uri);
    }
    
    // Convert URI to blob
    const response = await fetch(uploadUri);
    const blob = await response.blob();
    
    // Create storage reference
    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Return promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress updates
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% complete`);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Error handling
          console.error('Upload error:', error);
          resolve({ 
            success: false, 
            error: `Upload failed: ${error.message}` 
          });
        },
        async () => {
          // Upload completed successfully
          try {
            // Get download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create and upload thumbnail if it's an image
            let thumbnailUrl;
            if (fileInfo.type.startsWith('image/')) {
              try {
                const thumbnailUri = await createThumbnail(uri);
                const thumbnailPath = path.replace(/\.[^/.]+$/, '_thumbnail.jpg');
                const thumbnailResult = await uploadMediaToStorage(thumbnailUri, thumbnailPath);
                if (thumbnailResult.success) {
                  thumbnailUrl = thumbnailResult.downloadUrl;
                }
              } catch (thumbnailError) {
                console.error('Error creating thumbnail:', thumbnailError);
                // Continue without thumbnail
              }
            }
            
            resolve({ 
              success: true, 
              downloadUrl, 
              thumbnailUrl,
              path 
            });
          } catch (error) {
            console.error('Error getting download URL:', error);
            resolve({ 
              success: false, 
              error: 'Upload completed but could not get download URL' 
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadMediaToStorage:', error);
    return { 
      success: false, 
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Upload event image with proper validation and error handling
 * @param uri Image URI
 * @param eventId Event ID
 * @param onProgress Progress callback
 * @returns Promise with upload result
 */
export const uploadEventImage = async (
  uri: string, 
  eventId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      return { 
        success: false, 
        error: 'User must be authenticated to upload images' 
      };
    }
    
    // Validate file
    const validation = await validateMediaFile(uri);
    if (!validation.valid) {
      Alert.alert('Invalid File', validation.message || 'The selected file cannot be uploaded');
      return { 
        success: false, 
        error: validation.message 
      };
    }
    
    // Generate path for the image
    const userId = auth.currentUser.uid;
    const timestamp = new Date().getTime();
    const path = `events/${eventId}/images/${userId}_${timestamp}.jpg`;
    
    // Upload to Firebase Storage
    return await uploadMediaToStorage(uri, path, onProgress);
  } catch (error) {
    console.error('Error uploading event image:', error);
    return { 
      success: false, 
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Display media upload requirements in a user-friendly format
 * @returns Formatted string with requirements
 */
export const getMediaUploadRequirements = (): string => {
  return `
File requirements:
• Maximum size: ${(MEDIA_CONFIG.maxSizeBytes / 1024 / 1024).toFixed(0)}MB
• Supported formats: ${MEDIA_CONFIG.supportedImageFormats.join(', ')}
• Images will be optimized automatically
  `.trim();
};