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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PrivacyLevel } from '../models/social';
import { useAuth } from '../AuthContext';
import { useSocialPosts } from '../hooks/useSocialPosts';
import { createShadow } from '../utils/platformUtils';

interface PostCreationProps {
  onClose: () => void;
  onPostCreated: (newPost: any) => void;
  paddingTop?: number;
}

export default function PostCreation({
  onClose,
  onPostCreated,
  paddingTop = Platform.OS === 'ios' ? 130 : 110
}: PostCreationProps) {
  const { user } = useAuth();
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postPrivacy, setPostPrivacy] = useState<PrivacyLevel>(PrivacyLevel.PUBLIC);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const {
    createPost,
    isUploading,
    uploadProgress
  } = useSocialPosts();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setPostImages([...postImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image selection error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setPostImages([...postImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...postImages];
    updatedImages.splice(index, 1);
    setPostImages(updatedImages);
  };

  const getPrivacyText = (privacy: PrivacyLevel): string => {
    switch (privacy) {
      case PrivacyLevel.CONNECTIONS:
        return 'Connections Only';
      case PrivacyLevel.PRIVATE:
        return 'Private';
      default:
        return 'Public';
    }
  };

  const getPrivacyIcon = (privacy: PrivacyLevel): "public" | "people" | "lock" => {
    switch (privacy) {
      case PrivacyLevel.CONNECTIONS:
        return 'people';
      case PrivacyLevel.PRIVATE:
        return 'lock';
      default:
        return 'public';
    }
  };

  const submitPost = async () => {
    if (!postText.trim() && postImages.length === 0) {
      Alert.alert('Empty Post', 'Add text or at least one image to post.');
      return;
    }

    try {
      const newPost = await createPost(postText.trim(), postImages, postPrivacy);
      onPostCreated(newPost);
      onClose();
    } catch (error) {
      console.error('Post submission error:', error);
      Alert.alert('Error', 'Could not submit post.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!postText.trim() && postImages.length === 0) && styles.postButtonDisabled]}
          onPress={submitPost}
          disabled={isUploading || (!postText.trim() && postImages.length === 0)}
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

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.userInfo}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
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

        {postImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScrollView}
          >
            {postImages.map((image, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Media Selection Buttons */}
      <View style={styles.mediaSelectionContainer}>
        <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
          <MaterialIcons name="photo-library" size={24} color="#4B5563" />
          <Text style={styles.mediaButtonText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
          <MaterialIcons name="camera-alt" size={24} color="#4B5563" />
          <Text style={styles.mediaButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPrivacyModal(false)}
        >
          <View style={styles.privacyModal}>
            {[
              { level: PrivacyLevel.PUBLIC, icon: 'public', desc: 'Anyone can see this post' },
              { level: PrivacyLevel.CONNECTIONS, icon: 'people', desc: 'Only your connections can see this post' },
              { level: PrivacyLevel.PRIVATE, icon: 'lock', desc: 'Only you can see this post' },
            ].map(({ level, icon, desc }) => (
              <TouchableOpacity
                key={level}
                style={styles.privacyOption}
                onPress={() => {
                  setPostPrivacy(level);
                  setShowPrivacyModal(false);
                }}
              >
                <MaterialIcons name={icon as any} size={24} color="#4B5563" />
                <View style={styles.privacyOptionTextContainer}>
                  <Text style={styles.privacyOptionTitle}>{getPrivacyText(level)}</Text>
                  <Text style={styles.privacyOptionDescription}>{desc}</Text>
                </View>
                {postPrivacy === level && (
                  <MaterialIcons name="check" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// 💅 STYLES
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
    position: 'relative',
    marginRight: 12,
    width: 200,
  },
  imagePreview: {
    width: 200,
    height: 200,
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
  mediaSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  imagesScrollView: {
    marginTop: 16,
    flexDirection: 'row',
  },
});
