// app/posts/PostCreation.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Alert,
  ProgressBarAndroid
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PrivacyLevel, ContentType } from '../models/social';
import { useAuth } from '../AuthContext';
import { useSocialPosts } from '../hooks/useSocialPosts';
import { createShadow } from '../utils/platformUtils';

interface PostCreationProps {
  onClose: () => void;
  onPostCreated: (newPost: any) => void;
}

export default function PostCreation({ onClose, onPostCreated }: PostCreationProps) {
  const { user } = useAuth();
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postPrivacy, setPostPrivacy] = useState<PrivacyLevel>(PrivacyLevel.PUBLIC);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Use the social posts hook for post creation and image uploads
  const {
    createPost,
    isLoading,
    isUploading,
    uploadProgress
  } = useSocialPosts();

  // Pick an image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permission to upload images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Take a photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permission to take photos.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Get privacy level text
  const getPrivacyText = (privacy: PrivacyLevel): string => {
    switch (privacy) {
      case PrivacyLevel.PUBLIC:
        return 'Public';
      case PrivacyLevel.CONNECTIONS:
        return 'Connections Only';
      case PrivacyLevel.PRIVATE:
        return 'Private';
      default:
        return 'Public';
    }
  };

  // Get privacy icon
  const getPrivacyIcon = (privacy: PrivacyLevel): "public" | "people" | "lock" => {
    switch (privacy) {
      case PrivacyLevel.PUBLIC:
        return 'public';
      case PrivacyLevel.CONNECTIONS:
        return 'people';
      case PrivacyLevel.PRIVATE:
        return 'lock';
      default:
        return 'public';
    }
  };

  // Submit the post
  const submitPost = async () => {
    if (!postText.trim() && !postImage) {
      Alert.alert('Error', 'Please enter some text or add an image');
      return;
    }
    
    try {
      // Prepare media files array
      let mediaFiles: string[] = [];
      if (postImage) {
        mediaFiles.push(postImage);
      }
      
      // Create the post using the hook
      const newPost = await createPost(
        postText.trim(),
        mediaFiles,
        postPrivacy
      );
      
      // Notify parent and close
      onPostCreated(newPost);
      onClose();
      
    } catch (error) {
      console.error('Error creating post:', error);
      
      // Show more specific error message if available
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create post. Please try again.';
        
      Alert.alert('Error', errorMessage);
    }
  };

  // Render the privacy selector modal
  const renderPrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPrivacyModal(false)}
      >
        <View style={styles.privacyModal}>
          <Text style={styles.privacyModalTitle}>Who can see your post?</Text>
          
          <TouchableOpacity
            style={styles.privacyOption}
            onPress={() => {
              setPostPrivacy(PrivacyLevel.PUBLIC);
              setShowPrivacyModal(false);
            }}
          >
            <MaterialIcons name="public" size={24} color="#4B5563" />
            <View style={styles.privacyOptionTextContainer}>
              <Text style={styles.privacyOptionTitle}>Public</Text>
              <Text style={styles.privacyOptionDescription}>
                Anyone can see this post
              </Text>
            </View>
            {postPrivacy === PrivacyLevel.PUBLIC && (
              <MaterialIcons name="check" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.privacyOption}
            onPress={() => {
              setPostPrivacy(PrivacyLevel.CONNECTIONS);
              setShowPrivacyModal(false);
            }}
          >
            <MaterialIcons name="people" size={24} color="#4B5563" />
            <View style={styles.privacyOptionTextContainer}>
              <Text style={styles.privacyOptionTitle}>Connections Only</Text>
              <Text style={styles.privacyOptionDescription}>
                Only your connections can see this post
              </Text>
            </View>
            {postPrivacy === PrivacyLevel.CONNECTIONS && (
              <MaterialIcons name="check" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.privacyOption}
            onPress={() => {
              setPostPrivacy(PrivacyLevel.PRIVATE);
              setShowPrivacyModal(false);
            }}
          >
            <MaterialIcons name="lock" size={24} color="#4B5563" />
            <View style={styles.privacyOptionTextContainer}>
              <Text style={styles.privacyOptionTitle}>Private</Text>
              <Text style={styles.privacyOptionDescription}>
                Only you can see this post
              </Text>
            </View>
            {postPrivacy === PrivacyLevel.PRIVATE && (
              <MaterialIcons name="check" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[
            styles.postButton,
            (!postText.trim() && !postImage) && styles.postButtonDisabled
          ]}
          onPress={submitPost}
          disabled={isUploading || (!postText.trim() && !postImage)}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.uploadingText}>{Math.round(uploadProgress * 100)}%</Text>
            </View>
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.userInfo}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          )}
          
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{user?.name || 'Anonymous'}</Text>
            <TouchableOpacity
              style={styles.privacySelector}
              onPress={() => setShowPrivacyModal(true)}
            >
              <MaterialIcons name={getPrivacyIcon(postPrivacy)} size={16} color="#6B7280" />
              <Text style={styles.privacyText}>{getPrivacyText(postPrivacy)}</Text>
              <MaterialIcons name="arrow-drop-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TextInput
          style={styles.postInput}
          placeholder="What's on your mind?"
          multiline
          value={postText}
          onChangeText={setPostText}
          autoFocus
        />
        
        {postImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: postImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setPostImage(null)}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Add to your post</Text>
        <View style={styles.mediaOptions}>
          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <MaterialIcons name="photo-library" size={24} color="#10B981" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
            <MaterialIcons name="photo-camera" size={24} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mediaButton}>
            <MaterialIcons name="videocam" size={24} color="#F59E0B" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mediaButton}>
            <MaterialIcons name="event" size={24} color="#EC4899" />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderPrivacyModal()}
    </View>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingTop: 60
      },
      android: {
        paddingTop: 16
      }
    })
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    ...cardShadow,
  },
  postButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userNameContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  privacySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 4,
  },
  postInput: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  mediaOptions: {
    flexDirection: 'row',
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyModal: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  privacyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  privacyOptionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
});