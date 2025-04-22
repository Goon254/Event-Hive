/**
 * EnhancedImageUpload Component
 * 
 * An improved component for uploading and displaying images using the enhanced image service.
 * Supports image optimization, Firebase Storage integration, and progress tracking.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { enhancedImageService, ImageType, ImageQuality, ImageSize } from '../../services/enhancedImageService';

interface EnhancedImageUploadProps {
  /** Callback when an image is selected and processed */
  onImageSelected: (uri: string) => void;
  
  /** Initial image URI to display */
  initialImage?: string | null;
  
  /** Width of the image container */
  width?: number;
  
  /** Height of the image container */
  height?: number;
  
  /** Image type for storage path determination */
  imageType?: ImageType;
  
  /** Optional ID for storage path (e.g., event ID) */
  id?: string;
  
  /** Whether the component is in a submitting state */
  isSubmitting?: boolean;
  
  /** Placeholder text when no image is selected */
  placeholderText?: string;
}

/**
 * An enhanced component for uploading and displaying images
 */
export default function EnhancedImageUpload({
  onImageSelected,
  initialImage,
  width = 200,
  height = 150,
  imageType = ImageType.EVENT,
  id,
  isSubmitting = false,
  placeholderText = "Upload Image"
}: EnhancedImageUploadProps) {
  // Convert initialImage to a string or undefined to avoid type issues
  const initialImageUri = initialImage && typeof initialImage === 'string' ? initialImage : undefined;
  
  const [imageUri, setImageUri] = useState<string | undefined>(initialImageUri);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Update local state when initialImage changes
  useEffect(() => {
    if (initialImage && typeof initialImage === 'string') {
      setImageUri(initialImage);
    } else {
      setImageUri(undefined);
    }
  }, [initialImage]);
  
  /**
   * Handle image selection and processing
   */
  const selectImage = async () => {
    try {
      // Use the enhanced image service to pick an image
      const selectedImageUri = await enhancedImageService.pickImage({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (selectedImageUri) {
        // Update local state immediately for UI feedback
        setImageUri(selectedImageUri);
        
        // For local development, we can just pass the URI back
        // In production, we would upload to Firebase Storage
        if (__DEV__ && !id) {
          onImageSelected(selectedImageUri);
        } else {
          // Upload to Firebase Storage if we have an ID
          await uploadImage(selectedImageUri);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  /**
   * Upload image to Firebase Storage
   */
  const uploadImage = async (uri: string) => {
    try {
      // Check if the URI is already a Firebase Storage URL
      if (uri.startsWith('https://firebasestorage.googleapis.com/')) {
        console.log("Image is already uploaded to Firebase Storage, skipping upload");
        onImageSelected(uri);
        return;
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Configure upload options
      const uploadOptions = {
        quality: ImageQuality.HIGH,
        maxWidth: ImageSize.MEDIUM,
        maxHeight: ImageSize.MEDIUM,
        compress: true,
        generateThumbnail: true,
        thumbnailSize: 300,
        onProgress: (progress: number) => {
          setUploadProgress(progress);
        }
      };
      
      // Upload the image using the appropriate method based on image type
      let downloadUrl: string;
      
      if (imageType === ImageType.EVENT) {
        const result = await enhancedImageService.uploadEventImage(uri, id, uploadOptions);
        downloadUrl = result.url;
      } else if (imageType === ImageType.EVENT_SPEAKER) {
        if (!id) {
          throw new Error('Event ID is required for speaker image upload');
        }
        downloadUrl = await enhancedImageService.uploadEventSpeakerImage(uri, id, uploadOptions);
      } else if (imageType === ImageType.PROFILE) {
        downloadUrl = await enhancedImageService.uploadProfileImage(uri, uploadOptions);
      } else {
        // Default to test upload for development
        downloadUrl = await enhancedImageService.uploadTestImage(uri, uploadOptions);
      }
      
      // Pass the download URL back to the parent component
      onImageSelected(downloadUrl);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      
      // Revert to initial image if upload fails
      setImageUri(initialImageUri);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={[styles.imageContainer, { width, height }]}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            {isUploading ? (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.progressText}>
                  {Math.round(uploadProgress * 100)}%
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={selectImage}
                disabled={isSubmitting || isUploading}
                accessibilityLabel="Change image"
              >
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.uploadButton, { width, height }]}
          onPress={selectImage}
          disabled={isSubmitting || isUploading}
          accessibilityLabel="Upload image"
        >
          <MaterialIcons name="add-photo-alternate" size={32} color="#6B7280" />
          <Text style={styles.uploadText}>{placeholderText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  changeButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});