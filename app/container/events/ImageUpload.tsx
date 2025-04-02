// Updated ImageUpload component for app/container/events/ImageUpload.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ImageUploadProps {
  onImageSelected: (uri: string) => void;
  initialImage?: string;
  label?: string;
}

export default function ImageUpload({ 
  onImageSelected, 
  initialImage,
  label = "Event Image"
}: ImageUploadProps) {
  const [imageUri, setImageUri] = useState<string | null>(initialImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if permission was already granted
    (async () => {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);
      
      // Request permission if not already granted
      if (hasPermission !== true) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Permission needed', 
            'Please grant permission to access your photos',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        console.log('Selected image URI:', selectedUri);
        
        // Verify the URI is valid
        if (!selectedUri) {
          throw new Error('Image URI is empty or invalid');
        }
        
        // On iOS, ensure URI starts with file://
        const formattedUri = Platform.OS === 'ios' && !selectedUri.startsWith('file://')
          ? `file://${selectedUri}`
          : selectedUri;
          
        setImageUri(formattedUri);
        onImageSelected(formattedUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to use the camera');
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedUri = result.assets[0].uri;
        console.log('Captured image URI:', capturedUri);
        
        // Verify the URI is valid
        if (!capturedUri) {
          throw new Error('Image URI is empty or invalid');
        }
        
        // On iOS, ensure URI starts with file://
        const formattedUri = Platform.OS === 'ios' && !capturedUri.startsWith('file://')
          ? `file://${capturedUri}`
          : capturedUri;
          
        setImageUri(formattedUri);
        onImageSelected(formattedUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    onImageSelected('');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.overlay}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={pickImage}
              disabled={isLoading}
            >
              <FontAwesome name="edit" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={removeImage}
              disabled={isLoading}
            >
              <FontAwesome name="trash" size={18} color="white" />
            </TouchableOpacity>
          </View>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <FontAwesome name="image" size={24} color="#007AFF" />
                <Text style={styles.buttonText}>Choose Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <FontAwesome name="camera" size={24} color="#007AFF" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  editButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
});