import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { commentsModalStyles as styles } from '../../(tabs)/Feed.styles';
import { SocialPost } from '../../models/social';
import socialService from '../../services/socialService';
import { toDateObject, getRelativeTime } from '../../utils/dateUtils';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface CommentsModalProps {
  visible: boolean;
  post: SocialPost | null;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
}

// Format the timestamp for display with robust error handling
const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  
  try {
    // Use our robust date conversion utility
    const dateObj = toDateObject(timestamp);
    
    // If we couldn't parse the date, return a default value
    if (!dateObj) return 'Recently';
    
    // Use our utility that handles relative time formatting
    return getRelativeTime(dateObj);
  } catch (error) {
    console.warn('Error formatting timestamp:', error);
    return 'Recently';
  }
};

// Generate a consistent color based on the user's name
const generateColorFromName = (name: string): string => {
  const colors = [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];
  
  // Simple hash function to get a consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  post,
  onClose,
  userName,
  userAvatar
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsUnsubscribe, setCommentsUnsubscribe] = useState<(() => void) | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Fetch comments when the modal is opened
  useEffect(() => {
    if (visible && post) {
      fetchComments();
    }
    
    // Cleanup function
    return () => {
      if (commentsUnsubscribe) {
        commentsUnsubscribe();
      }
    };
  }, [visible, post]);

  // Fetch comments from Firestore
  const fetchComments = async () => {
    if (!post) return;
    
    setIsLoadingComments(true);
    
    try {
      // Fetch comments from Firestore
      const fetchedComments = await socialService.getPostComments(post.id);
      setComments(fetchedComments);
      
      // Set up real-time listener for new comments
      const unsubscribe = socialService.setupCommentsListener(post.id, (updatedComments) => {
        setComments(updatedComments);
      });
      
      // Store unsubscribe function
      setCommentsUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Add a comment to the current post
  const addComment = async () => {
    if (!post || !commentText.trim()) return;
    
    try {
      // Create a new comment
      const newComment = {
        id: Date.now().toString(),
        userName: userName || 'Anonymous',
        content: commentText,
        createdAt: new Date()
      };
      
      // Add to comments list
      setComments([...comments, newComment]);
      setCommentText('');
      
      // Save the comment to Firestore
      await socialService.commentOnPost(post.id, commentText);
      
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Focus the comment input
  const focusCommentInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Render empty state for comments
  const renderEmptyComments = () => (
    <View style={styles.emptyCommentsContainer}>
      <MaterialIcons name="chat-bubble-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
      <Text style={styles.emptyCommentsText}>
        Be the first to share your thoughts on this post!
      </Text>
      <TouchableOpacity 
        style={styles.startCommentingButton}
        onPress={focusCommentInput}
      >
        <Text style={styles.startCommentingText}>Start Commenting</Text>
      </TouchableOpacity>
    </View>
  );

  // Use KeyboardAwareScrollView on Android to avoid keyboard issues
  const CommentsContainer = Platform.OS === 'android' 
    ? KeyboardAwareScrollView 
    : ScrollView;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.commentsContainer}>
        <View style={styles.commentsHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.commentsTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Original post summary */}
        {post && (
          <View style={styles.originalPost}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {post.userAvatar ? (
                <Image source={{ uri: post.userAvatar }} style={styles.userAvatarSmall} />
              ) : (
                <View style={[
                  styles.userAvatarSmallPlaceholder, 
                  { backgroundColor: generateColorFromName(post.userName) }
                ]}>
                  <Text style={styles.avatarInitialSmall}>
                    {post.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <View style={{ marginLeft: 12 }}>
                <Text>{post.userName}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{formatTimestamp(post.createdAt)}</Text>
              </View>
            </View>
            
            <Text style={styles.originalPostText} numberOfLines={2}>
              {post.content}
            </Text>
          </View>
        )}
        
        {/* Comments list */}
        {isLoadingComments ? (
          <ActivityIndicator style={{ padding: 20, marginTop: 20 }} />
        ) : (
          <CommentsContainer
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={[
                  styles.commentItem,
                  index === comments.length - 1 && { marginBottom: 40 } // Extra margin for last item
                ]}>
                  {item.userAvatar ? (
                    <Image source={{ uri: item.userAvatar }} style={styles.userAvatarSmall} />
                  ) : (
                    <View style={[
                      styles.userAvatarSmallPlaceholder,
                      { backgroundColor: generateColorFromName(item.userName) }
                    ]}>
                      <Text style={styles.avatarInitialSmall}>
                        {item.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUserName}>{item.userName}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <Text style={styles.commentTime}>{formatTimestamp(item.createdAt)}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={renderEmptyComments}
              contentContainerStyle={[
                styles.commentsList,
                comments.length === 0 && { flex: 1, justifyContent: 'center' }
              ]}
            />
          </CommentsContainer>
        )}
        
        {/* Comment input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.commentInputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={addComment}
              disabled={!commentText.trim()}
            >
              <MaterialIcons 
                name="send" 
                size={20} 
                color={commentText.trim() ? "#007AFF" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default CommentsModal;