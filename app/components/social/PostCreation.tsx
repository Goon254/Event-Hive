import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { postCreationStyles as styles } from '../../(tabs)/Feed.styles';
import { PrivacyLevel } from '../../models/social';
import * as ImagePicker from 'expo-image-picker';
import { enhancedImageService } from '../../services/enhancedImageService';

interface PostCreationProps {
  onClose: () => void;
  onSubmit: (text: string, image: string | null, privacy: PrivacyLevel) => Promise<void>;
  userName: string | undefined;
  userAvatar: string | undefined;
  isUploading: boolean;
  uploadProgress: number;
}

const PostCreation: React.FC<PostCreationProps> = ({
  onClose,
  onSubmit,
  userName,
  userAvatar,
  isUploading,
  uploadProgress
}) => {
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postPrivacy, setPostPrivacy] = useState<PrivacyLevel>(PrivacyLevel.PUBLIC);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Pick an image from gallery using enhanced image service
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
        setPostImage(selectedImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Handle post submission
  const handleSubmit = async () => {
    await onSubmit(postText, postImage, postPrivacy);
  };

  // Get privacy level display text
  const getPrivacyText = (privacy: PrivacyLevel): string => {
    switch (privacy) {
      case PrivacyLevel.PUBLIC:
        return 'Public';
      case PrivacyLevel.CONNECTIONS:
        return 'Connections';
      case PrivacyLevel.PRIVATE:
        return 'Only Me';
      default:
        return 'Public';
    }
  };

  // Get privacy level icon
  const getPrivacyIcon = (privacy: PrivacyLevel): string => {
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
      style={{ flex: 1 }}
    >
      <View style={styles.createPostCard}>
        <View style={styles.createPostHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.createPostTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postButton, (!postText.trim() && !postImage) && styles.postButtonDisabled]}
            onPress={handleSubmit}
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
        
        <View style={styles.createPostContent}>
          <View style={styles.createPostUser}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Text style={styles.avatarInitial}>{userName?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
            <View>
              <Text>{userName || 'User'}</Text>
              <TouchableOpacity 
                style={styles.privacySelector}
                onPress={() => setShowPrivacyModal(true)}
              >
                <MaterialIcons
                  name={getPrivacyIcon(postPrivacy) as "public" | "people" | "lock"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.privacyText}>{getPrivacyText(postPrivacy)}</Text>
                <MaterialIcons name="arrow-drop-down" size={16} color="#FFFFFF" />
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
        </View>
        
        <View style={styles.createPostActions}>
          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <MaterialIcons name="photo" size={24} color="#10B981" />
            <Text style={styles.mediaButtonText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mediaButton}>
            <MaterialIcons name="event" size={24} color="#3B82F6" />
            <Text style={styles.mediaButtonText}>Event</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy Selection Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setShowPrivacyModal(false)}
        >
          <View style={styles.privacyModal}>
            <View style={styles.privacyModalContent}>
              <Text style={styles.privacyModalTitle}>Who can see your post?</Text>
              
              <TouchableOpacity 
                style={[
                  styles.privacyOption,
                  postPrivacy === PrivacyLevel.PUBLIC && styles.privacyOptionSelected
                ]}
                onPress={() => {
                  setPostPrivacy(PrivacyLevel.PUBLIC);
                  setShowPrivacyModal(false);
                }}
              >
                <MaterialIcons name="public" size={24} color="#6B7280" />
                <Text style={styles.privacyOptionText}>Public</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.privacyOption,
                  postPrivacy === PrivacyLevel.CONNECTIONS && styles.privacyOptionSelected
                ]}
                onPress={() => {
                  setPostPrivacy(PrivacyLevel.CONNECTIONS);
                  setShowPrivacyModal(false);
                }}
              >
                <MaterialIcons name="people" size={24} color="#6B7280" />
                <Text style={styles.privacyOptionText}>Connections Only</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.privacyOption,
                  postPrivacy === PrivacyLevel.PRIVATE && styles.privacyOptionSelected
                ]}
                onPress={() => {
                  setPostPrivacy(PrivacyLevel.PRIVATE);
                  setShowPrivacyModal(false);
                }}
              >
                <MaterialIcons name="lock" size={24} color="#6B7280" />
                <Text style={styles.privacyOptionText}>Only Me</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default PostCreation;