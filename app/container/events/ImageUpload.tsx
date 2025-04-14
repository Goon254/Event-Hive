/**
 * ImageUpload Component
 * 
 * A component for uploading and displaying images.
 * This is a mock implementation for the refactoring project.
 */

import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
   * Request permission to access the media library
   */
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to upload images.',
            [{ text: 'OK' }]
          );
        }
      }
    })();
  }, []);

  /**
   * Open the image picker to select an image from the gallery
   */
  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setImageUri(selectedImageUri);
        onImageSelected(selectedImageUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
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