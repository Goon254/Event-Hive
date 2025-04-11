/**
 * ImageUpload Component
 * 
 * A component for uploading and displaying images.
 * This is a mock implementation for the refactoring project.
 */

import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ImageUploadProps {
  /** Callback when an image is selected */
  onImageSelected: (uri: string) => void;
  
  /** Initial image URI to display */
  initialImage?: string;
  
  /** Width of the image container */
  width?: number;
  
  /** Height of the image container */
  height?: number;
}

/**
 * A component for uploading and displaying images
 * 
 * @example
 * <ImageUpload
 *   onImageSelected={handleImageSelected}
 *   initialImage={formData.imageUri || undefined}
 * />
 */
export default function ImageUpload({
  onImageSelected,
  initialImage,
  width = 200,
  height = 150,
}: ImageUploadProps) {
  const [imageUri, setImageUri] = useState<string | undefined>(initialImage);
  
  /**
   * Simulate image selection
   * In a real implementation, this would use image picker
   */
  const selectImage = () => {
    // Mock image selection - in a real app, this would use a library like expo-image-picker
    const mockImageUri = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Event+Image';
    setImageUri(mockImageUri);
    onImageSelected(mockImageUri);
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
            <TouchableOpacity 
              style={styles.changeButton}
              onPress={selectImage}
              accessibilityLabel="Change image"
            >
              <MaterialIcons name="edit" size={20} color="#FFFFFF" />
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.uploadButton, { width, height }]}
          onPress={selectImage}
          accessibilityLabel="Upload image"
        >
          <MaterialIcons name="add-photo-alternate" size={32} color="#6B7280" />
          <Text style={styles.uploadText}>Upload Image</Text>
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
});