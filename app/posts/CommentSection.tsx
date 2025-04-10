// app/posts/CommentSection.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Comment } from '../models/social';
import { useAuth } from '../AuthContext';
import socialService from '../services/socialService';
import { createShadow } from '../utils/platformUtils';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

interface CommentSectionProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
  authorName: string;
  authorAvatar?: string;
  postTime: any; // timestamp
}

export default function CommentSection({
  visible,
  onClose,
  postId,
  postContent,
  authorName,
  authorAvatar,
  postTime
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments when modal opens
  useEffect(() => {
    if (visible) {
      fetchComments();
    }
  }, [visible, postId]);

  // Get comments for the post
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const fetchedComments = await socialService.getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new comment
  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create the comment
      const commentData = await socialService.commentOnPost(postId, newComment.trim());
      
      // Add to comments list
      setComments([...comments, commentData]);
      
      // Clear input
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format the timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Like a comment
  const likeComment = async (commentId: string) => {
    // For demo, just update UI optimistically
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, likes: (comment.likes || 0) + 1 };
      }
      return comment;
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Original post summary */}
        <View style={styles.originalPost}>
          <View style={styles.authorInfo}>
            {authorAvatar ? (
              <Image source={{ uri: authorAvatar }} style={styles.authorAvatar} />
            ) : (
              <View style={styles.authorAvatarPlaceholder}>
                <Text style={styles.avatarInitial}>{authorName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            
            <View style={styles.authorNameContainer}>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.postTime}>{formatTimestamp(postTime)}</Text>
            </View>
          </View>
          
          <Text style={styles.postContent} numberOfLines={2}>
            {postContent}
          </Text>
        </View>
        
        {/* Comments list */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentContainer}>
                {item.userAvatar ? (
                  <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
                ) : (
                  <View style={styles.commentAvatarPlaceholder}>
                    <Text style={styles.commentAvatarText}>
                      {item.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                  
                  <View style={styles.commentActions}>
                    <Text style={styles.commentTime}>
                      {formatTimestamp(item.createdAt)}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.likeButton}
                      onPress={() => likeComment(item.id)}
                    >
                      <Text style={styles.likeText}>Like</Text>
                      {item.likes > 0 && (
                        <Text style={styles.likeCount}> · {item.likes}</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.replyButton}>
                      <Text style={styles.replyText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.emptyCommentsContainer}>
                <MaterialIcons name="forum" size={48} color="#D1D5DB" />
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            }
          />
        )}
        
        {/* Comment input */}
        <View style={styles.commentInputContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled
              ]}
              onPress={addComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons 
                  name="send" 
                  size={20} 
                  color={newComment.trim() ? "#FFFFFF" : "#9CA3AF"} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(1);

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
  originalPost: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  authorInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorNameContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  postContent: {
    fontSize: 14,
    color: '#4B5563',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    padding: 16,
    flexGrow: 1,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  commentContent: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  likeButton: {
    flexDirection: 'row',
    marginRight: 8,
  },
  likeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  likeCount: {
    fontSize: 12,
    color: '#4B5563',
  },
  replyButton: {
    marginLeft: 8,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingBottom: 30
      }
    })
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    padding: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  }
});