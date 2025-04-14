// app/screens/EnhancedImageUploadDemo.tsx
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
  Switch,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageType, ImageQuality, ImageSize } from '../services/enhancedImageService';
import { useAuth } from '../AuthContext';

/**
 * Enhanced Image Upload Demo Screen
 * 
 * This screen demonstrates the usage of the enhanced image service and hook.
 * It provides a user interface for:
 * - Selecting images from the gallery or camera
 * - Configuring upload options
 * - Uploading images with different types
 * - Viewing upload progress
 * - Displaying uploaded images and thumbnails
 */
export default function EnhancedImageUploadDemo() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    imageUri,
    uploadedUrl,
    thumbnailUrl,
    isUploading,
    uploadProgress,
    error,
    pickImage,
    takePhoto,
    uploadImage,
    resetImage,
  } = useImageUpload();
  
  // Upload configuration
  const [selectedType, setSelectedType] = useState<ImageType>(ImageType.TEST);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.HIGH);
  const [maxSize, setMaxSize] = useState<ImageSize>(ImageSize.MEDIUM);
  const [compress, setCompress] = useState(true);
  const [generateThumbnail, setGenerateThumbnail] = useState(true);
  const [customId, setCustomId] = useState('');
  
  // Reset error when component unmounts
  useEffect(() => {
    return () => {
      resetImage();
    };
  }, [resetImage]);
  
  // Handle image selection from gallery
  const handlePickImage = async () => {
    await pickImage({
      allowsEditing: true,
      aspect: selectedType === ImageType.PROFILE ? [1, 1] : [4, 3],
    });
  };
  
  // Handle image capture from camera
  const handleTakePhoto = async () => {
    await takePhoto({
      allowsEditing: true,
      aspect: selectedType === ImageType.PROFILE ? [1, 1] : [4, 3],
    });
  };
  
  // Handle image upload
  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }
    
    try {
      // Prepare upload options
      const options = {
        quality,
        maxWidth: maxSize,
        maxHeight: maxSize,
        compress,
        generateThumbnail,
        thumbnailSize: selectedType === ImageType.PROFILE ? 150 : 300,
        metadata: {
          uploadedBy: user?.id || 'unknown',
          uploadedAt: new Date().toISOString(),
          demo: 'true',
        },
      };
      
      // Upload image
      const id = customId || undefined;
      const result = await uploadImage(selectedType, options, id);
      
      if (result) {
        Alert.alert('Success', 'Image uploaded successfully!');
      }
    } catch (err) {
      console.error('Error in handleUpload:', err);
    }
  };
  
  // Render image type selection
  const renderImageTypeSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Image Type</Text>
      <View style={styles.typeContainer}>
        {Object.values(ImageType).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              selectedType === type && styles.selectedTypeButton,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === type && styles.selectedTypeButtonText,
              ]}
            >
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {(selectedType === ImageType.POST || 
        selectedType === ImageType.EVENT || 
        selectedType === ImageType.EVENT_SPEAKER) && (
        <View style={styles.idContainer}>
          <Text style={styles.optionLabel}>
            {selectedType === ImageType.POST ? 'Post ID' : 
             selectedType === ImageType.EVENT ? 'Event ID' : 'Event ID (Required)'}:
          </Text>
          <TextInput
            style={styles.idInput}
            value={customId}
            onChangeText={setCustomId}
            placeholder={
              selectedType === ImageType.POST ? 'Optional Post ID' : 
              selectedType === ImageType.EVENT ? 'Optional Event ID' : 'Required Event ID'
            }
          />
        </View>
      )}
    </View>
  );
  
  // Render upload options
  const renderUploadOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upload Options</Text>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Quality:</Text>
        <View style={styles.optionButtonGroup}>
          {[
            { value: ImageQuality.LOW, label: 'Low' },
            { value: ImageQuality.MEDIUM, label: 'Medium' },
            { value: ImageQuality.HIGH, label: 'High' },
            { value: ImageQuality.ORIGINAL, label: 'Original' },
          ].map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                quality === option.value && styles.selectedOptionButton,
              ]}
              onPress={() => setQuality(option.value)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  quality === option.value && styles.selectedOptionButtonText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Max Size:</Text>
        <View style={styles.optionButtonGroup}>
          {[
            { value: ImageSize.SMALL, label: 'Small' },
            { value: ImageSize.MEDIUM, label: 'Medium' },
            { value: ImageSize.LARGE, label: 'Large' },
            { value: ImageSize.ORIGINAL, label: 'Original' },
          ].map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                maxSize === option.value && styles.selectedOptionButton,
              ]}
              onPress={() => setMaxSize(option.value)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  maxSize === option.value && styles.selectedOptionButtonText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.switchRow}>
        <Text style={styles.optionLabel}>Compress Large Images:</Text>
        <Switch
          value={compress}
          onValueChange={setCompress}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={compress ? '#007AFF' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.switchRow}>
        <Text style={styles.optionLabel}>Generate Thumbnail:</Text>
        <Switch
          value={generateThumbnail}
          onValueChange={setGenerateThumbnail}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={generateThumbnail ? '#007AFF' : '#f4f3f4'}
        />
      </View>
    </View>
  );
  
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
        <Text style={styles.title}>Enhanced Image Upload</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          This screen demonstrates the enhanced image upload service with optimized image processing,
          automatic thumbnails, and comprehensive error handling.
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
            onPress={handlePickImage}
            disabled={isUploading}
          >
            <MaterialIcons name="photo-library" size={24} color="#fff" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleTakePhoto}
            disabled={isUploading}
          >
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              (!imageUri || isUploading) && styles.buttonDisabled
            ]} 
            onPress={handleUpload}
            disabled={!imageUri || isUploading}
          >
            <MaterialIcons name="cloud-upload" size={24} color="#fff" />
            <Text style={styles.buttonText}>Upload</Text>
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
        
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        )}
        
        {/* Image Type Selection */}
        {renderImageTypeSelection()}
        
        {/* Upload Options */}
        {renderUploadOptions()}
        
        {/* Uploaded Images */}
        {uploadedUrl && (
          <View style={styles.uploadedContainer}>
            <Text style={styles.sectionTitle}>Uploaded Image</Text>
            <Image source={{ uri: uploadedUrl }} style={styles.uploadedImage} />
            <Text style={styles.urlText} selectable>{uploadedUrl}</Text>
            
            {thumbnailUrl && (
              <View style={styles.thumbnailContainer}>
                <Text style={styles.sectionTitle}>Thumbnail</Text>
                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
                <Text style={styles.urlText} selectable>{thumbnailUrl}</Text>
              </View>
            )}
          </View>
        )}
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
    flex: 0.32,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  idContainer: {
    marginTop: 8,
  },
  idInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  optionRow: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  optionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: '#FFFFFF',
  },
  uploadedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  thumbnailContainer: {
    marginTop: 16,
  },
  thumbnailImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
});