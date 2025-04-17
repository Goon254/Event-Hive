// app/hooks/useImageUpload.ts
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { enhancedImageService, ImageType, ImageUploadOptions } from '../services/enhancedImageService';
import { useAuth } from '../AuthContext';

/**
 * Image upload hook result
 */
export interface UseImageUploadResult {
  // State
  imageUri: string | null;
  uploadedUrl: string | null;
  thumbnailUrl: string | null;
  isUploading: boolean;
  uploadProgress: number;
  error: Error | null;
  
  // Actions
  pickImage: (options?: Partial<ImagePicker.ImagePickerOptions>) => Promise<string | null>;
  takePhoto: (options?: Partial<ImagePicker.ImagePickerOptions>) => Promise<string | null>;
  uploadImage: (type: ImageType, options?: Partial<ImageUploadOptions>, id?: string) => Promise<{
    url: string;
    thumbnailUrl?: string;
  } | null>;
  resetImage: () => void;
  setImageUri: (uri: string | null) => void;
}

/**
 * Custom hook for image upload operations
 * @returns Image upload state and actions
 */
export function useImageUpload(): UseImageUploadResult {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Pick an image from the device's media library
   * @param options ImagePicker options
   * @returns Promise resolving to the selected image URI or null if cancelled
   */
  const pickImage = useCallback(async (
    options?: Partial<ImagePicker.ImagePickerOptions>
  ): Promise<string | null> => {
    try {
      setError(null);
      
      const uri = await enhancedImageService.pickImage(options);
      
      if (uri) {
        setImageUri(uri);
        setUploadedUrl(null);
        setThumbnailUrl(null);
      }
      
      return uri;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pick image');
      setError(error);
      
      Alert.alert(
        'Image Selection Error',
        Platform.OS === 'ios' 
          ? 'Please allow access to your photos in Settings to select an image.'
          : 'Please allow access to your photos to select an image.'
      );
      
      return null;
    }
  }, []);
  
  /**
   * Take a photo using the device's camera
   * @param options ImagePicker options
   * @returns Promise resolving to the captured image URI or null if cancelled
   */
  const takePhoto = useCallback(async (
    options?: Partial<ImagePicker.ImagePickerOptions>
  ): Promise<string | null> => {
    try {
      setError(null);
      
      const uri = await enhancedImageService.takePhoto(options);
      
      if (uri) {
        setImageUri(uri);
        setUploadedUrl(null);
        setThumbnailUrl(null);
      }
      
      return uri;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to take photo');
      setError(error);
      
      Alert.alert(
        'Camera Error',
        Platform.OS === 'ios' 
          ? 'Please allow access to your camera in Settings to take a photo.'
          : 'Please allow access to your camera to take a photo.'
      );
      
      return null;
    }
  }, []);
  
  /**
   * Upload the selected image
   * @param type Image type
   * @param options Upload options
   * @param id Optional ID (post ID, event ID, etc.)
   * @returns Promise resolving to the uploaded image URL or null if failed
   */
  const uploadImage = useCallback(async (
    type: ImageType,
    options?: Partial<ImageUploadOptions>,
    id?: string
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
  } | null> => {
    if (!imageUri) {
      setError(new Error('No image selected'));
      return null;
    }
    
    if (!user) {
      setError(new Error('User must be authenticated to upload images'));
      return null;
    }
    
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);
      
      // Prepare upload options with progress tracking
      const uploadOptions: Partial<ImageUploadOptions> = {
        ...options,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      };
      
      // Upload image based on type
      let result;
      
      switch (type) {
        case ImageType.PROFILE:
          const profileUrl = await enhancedImageService.uploadProfileImage(imageUri, uploadOptions);
          result = { url: profileUrl };
          break;
          
        case ImageType.POST:
          result = await enhancedImageService.uploadPostImage(imageUri, id, uploadOptions);
          break;
          
        case ImageType.EVENT:
          result = await enhancedImageService.uploadEventImage(imageUri, id, uploadOptions);
          break;
          
        case ImageType.EVENT_SPEAKER:
          if (!id) {
            throw new Error('Event ID is required for speaker image upload');
          }
          const speakerUrl = await enhancedImageService.uploadEventSpeakerImage(imageUri, id, uploadOptions);
          result = { url: speakerUrl };
          break;
          
        case ImageType.TEST:
          const testUrl = await enhancedImageService.uploadTestImage(imageUri, uploadOptions);
          result = { url: testUrl };
          break;
          
        default:
          throw new Error(`Unsupported image type: ${type}`);
      }
      
      // Update state with upload results
      setUploadedUrl(result.url);
      setThumbnailUrl(result.thumbnailUrl || null);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload image');
      setError(error);
      
      Alert.alert(
        'Upload Error',
        error.message || 'Failed to upload image. Please try again.'
      );
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [imageUri, user]);
  
  /**
   * Reset image state
   */
  const resetImage = useCallback(() => {
    setImageUri(null);
    setUploadedUrl(null);
    setThumbnailUrl(null);
    setUploadProgress(0);
    setError(null);
  }, []);
  
  return {
    // State
    imageUri,
    uploadedUrl,
    thumbnailUrl,
    isUploading,
    uploadProgress,
    error,
    
    // Actions
    pickImage,
    takePhoto,
    uploadImage,
    resetImage,
    setImageUri
  };
}

// Add default export
export default useImageUpload;