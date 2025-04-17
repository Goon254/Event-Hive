import React, { useState, useEffect } from 'react';
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
 * Image Upload Debugger Screen
 * 
 * This screen is used to debug Firebase Storage image uploads.
 * It provides detailed logging and error reporting to help diagnose issues.
 */
export default function ImageUploadDebugger() {
  const router = useRouter();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [uploadType, setUploadType] = useState<ImageType>(ImageType.PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [storageBucket, setStorageBucket] = useState<string>('');

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prevLogs => [logEntry, ...prevLogs]);
    console.log(logEntry);
  };

  // Get storage bucket info
  useEffect(() => {
    try {
      const bucket = storage.app.options.storageBucket || 'Not configured';
      setStorageBucket(bucket);
      addLog(`Storage bucket: ${bucket}`);
    } catch (error) {
      addLog(`Error getting storage bucket: ${error}`);
    }
  }, []);

  // Request permission and pick an image
  const pickImage = async () => {
    try {
      addLog('Requesting image picker permission...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        addLog('Permission denied');
        Alert.alert('Permission Denied', 'Permission to access media library was denied');
        return;
      }
      
      addLog('Permission granted, opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        addLog(`Image selected: ${selectedUri.substring(0, 50)}...`);
        setImageUri(selectedUri);
        setDownloadUrl(null);
      } else {
        addLog('Image selection canceled');
      }
    } catch (error) {
      addLog(`Error picking image: ${error}`);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Upload the selected image to Firebase Storage
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
      addLog(`Starting upload of ${uploadType} image...`);

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
          source: 'debug-screen'
        },
        onProgress: (progress: number) => {
          setUploadProgress(progress);
          if (progress % 0.1 < 0.01) { // Log approximately every 10%
            addLog(`Upload progress: ${Math.round(progress * 100)}%`);
          }
        }
      };
      
      let result: string;
      
      // Upload based on selected type
      switch (uploadType) {
        case ImageType.PROFILE:
          addLog('Using enhancedImageService.uploadProfileImage');
          result = await enhancedImageService.uploadProfileImage(imageUri, uploadOptions);
          break;
        case ImageType.POST:
          addLog('Using enhancedImageService.uploadPostImage');
          result = await enhancedImageService.uploadPostImage(imageUri, undefined, uploadOptions).then(r => r.url);
          break;
        case ImageType.EVENT:
          addLog('Using enhancedImageService.uploadEventImage');
          result = await enhancedImageService.uploadEventImage(imageUri, undefined, uploadOptions).then(r => r.url);
          break;
        case ImageType.TEST:
          addLog('Using enhancedImageService.uploadTestImage');
          result = await enhancedImageService.uploadTestImage(imageUri, uploadOptions);
          break;
        default:
          addLog('Using enhancedImageService.uploadImage directly');
          result = await enhancedImageService.uploadImage(imageUri, uploadType, uploadOptions).then(r => r.url);
      }
      
      setDownloadUrl(result);
      addLog(`Upload successful! URL: ${result}`);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Error uploading image: ${errorMessage}`);
      Alert.alert('Error', `Failed to upload image: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

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
        <Text style={styles.title}>Image Upload Debugger</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Storage Configuration</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Storage Bucket: {storageBucket}</Text>
          <Text style={styles.infoText}>User ID: {user?.id || 'Not logged in'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Upload Test</Text>
        
        {/* Upload Type Selector */}
        <View style={styles.uploadTypeContainer}>
          <Text style={styles.label}>Upload Type:</Text>
          <View style={styles.uploadTypeButtons}>
            {Object.values(ImageType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.uploadTypeButton,
                  uploadType === type && styles.uploadTypeButtonSelected
                ]}
                onPress={() => {
                  setUploadType(type);
                  addLog(`Upload type set to: ${type}`);
                }}
              >
                <Text 
                  style={[
                    styles.uploadTypeButtonText,
                    uploadType === type && styles.uploadTypeButtonTextSelected
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
            
            {/* Preview the uploaded image */}
            <Text style={styles.urlTitle}>Uploaded Image:</Text>
            <Image 
              source={{ uri: downloadUrl }} 
              style={styles.uploadedImage}
              onLoad={() => addLog('Uploaded image loaded successfully')}
              onError={() => addLog('Error loading uploaded image')}
            />
          </View>
        )}

        {/* Logs */}
        <View style={styles.logsContainer}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>Debug Logs</Text>
            <TouchableOpacity onPress={clearLogs}>
              <MaterialIcons name="delete" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.logsList}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logEntry}>{log}</Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.noLogsText}>No logs yet</Text>
            )}
          </View>
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
  infoBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  uploadTypeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  uploadTypeButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  uploadTypeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  uploadTypeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  uploadTypeButtonTextSelected: {
    color: '#FFFFFF',
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
    marginBottom: 16,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  logsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 40,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logsList: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  logEntry: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
    marginBottom: 4,
  },
  noLogsText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
});