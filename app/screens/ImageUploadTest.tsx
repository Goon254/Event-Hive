import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { storage } from '../../lib/firebaseConfig';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { enhancedImageService, ImageType, ImageQuality, ImageSize } from '../services/enhancedImageService';
import { useAuth } from '../AuthContext';

/**
 * Image Upload Test Screen
 * 
 * This screen is used to test Firebase Storage image uploads.
 * It allows users to:
 * - Upload images to Firebase Storage
 * - View the uploaded image
 * - View the download URL
 * - List recent uploads
 * - Delete uploaded images
 */
export default function ImageUploadTest() {
  const router = useRouter();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentUploads, setRecentUploads] = useState<{ name: string, url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Request permission and pick an image using enhanced image service
  const pickImage = async () => {
    try {
      // Use the enhanced image service to pick an image
      const selectedImageUri = await enhancedImageService.pickImage({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (selectedImageUri) {
        setImageUri(selectedImageUri);
        setDownloadUrl(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Upload the selected image to Firebase Storage using enhanced image service
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Error', 'You must be logged in to upload images');
      return;
    }

    try {
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
        metadata: {
          userId: user.id,
          uploadedAt: new Date().toISOString(),
          source: 'test-screen'
        },
        onProgress: (progress: number) => {
          setUploadProgress(progress);
        }
      };
      
      // Upload the image using the enhanced image service
      const result = await enhancedImageService.uploadTestImage(imageUri, uploadOptions);
      
      setDownloadUrl(result);
      Alert.alert('Success', 'Image uploaded successfully!');
      
      // Refresh the recent uploads list
      fetchRecentUploads();
    } catch (error) {
      console.error('Error uploading image:', error);
      const firebaseError = error as { code?: string, message?: string };
      Alert.alert(
        'Error',
        firebaseError.message || 'Failed to upload image. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch recent uploads from Firebase Storage
  const fetchRecentUploads = async () => {
    if (!user || !user.id) return;

    try {
      setIsLoading(true);
      const testUploadsRef = ref(storage, `test_uploads/${user.id}`);
      const result = await listAll(testUploadsRef);
      
      const uploads = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            url,
          };
        })
      );

      setRecentUploads(uploads);
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
      // If the directory doesn't exist yet, that's okay
      const firebaseError = error as { code?: string };
      if (firebaseError.code !== 'storage/object-not-found') {
        Alert.alert('Error', 'Failed to fetch recent uploads');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an uploaded image
  const deleteImage = async (name: string) => {
    if (!user || !user.id) return;

    try {
      const imageRef = ref(storage, `test_uploads/${user.id}/${name}`);
      await deleteObject(imageRef);
      Alert.alert('Success', 'Image deleted successfully');
      
      // Refresh the list
      fetchRecentUploads();
    } catch (error) {
      console.error('Error deleting image:', error);
      const firebaseError = error as { code?: string, message?: string };
      Alert.alert('Error', firebaseError.message || 'Failed to delete image');
    }
  };

  // Load recent uploads when the component mounts
  React.useEffect(() => {
    if (user) {
      fetchRecentUploads();
    }
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Firebase Storage Test</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Upload Test</Text>
        <Text style={styles.description}>
          This screen tests Firebase Storage integration. Select an image to upload it to Firebase Storage.
        </Text>

        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="image" size={64} color="#ccc" />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickImage}
            disabled={isUploading}
          >
            <MaterialIcons name="photo-library" size={24} color="#fff" />
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              (!imageUri || isUploading) && styles.buttonDisabled
            ]} 
            onPress={uploadImage}
            disabled={!imageUri || isUploading}
          >
            <MaterialIcons name="cloud-upload" size={24} color="#fff" />
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${uploadProgress * 100}%` }]} />
            <Text style={styles.progressText}>
              {Math.round(uploadProgress * 100)}%
            </Text>
          </View>
        )}

        {/* Download URL */}
        {downloadUrl && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlTitle}>Download URL:</Text>
            <Text style={styles.url} selectable>{downloadUrl}</Text>
          </View>
        )}

        {/* Recent Uploads */}
        <View style={styles.recentUploadsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Uploads</Text>
            <TouchableOpacity onPress={fetchRecentUploads}>
              <MaterialIcons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : recentUploads.length > 0 ? (
            recentUploads.map((upload, index) => (
              <View key={index} style={styles.uploadItem}>
                <Image source={{ uri: upload.url }} style={styles.thumbnailImage} />
                <View style={styles.uploadDetails}>
                  <Text style={styles.uploadName} numberOfLines={1}>{upload.name}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteImage(upload.name)}
                  >
                    <MaterialIcons name="delete" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noUploadsText}>No recent uploads found</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CD964',
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 20,
  },
  urlContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  urlTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  url: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  recentUploadsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  uploadDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  uploadName: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  noUploadsText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});