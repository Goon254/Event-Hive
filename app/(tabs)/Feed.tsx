// app/(tabs)/Feed.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import socialService from '../services/socialService';
import { SocialPost, ContentType, PrivacyLevel } from '../models/social';
import * as ImagePicker from 'expo-image-picker';
import { createShadow } from '../utils/platformUtils';
import { format } from 'date-fns';
import { formatDistance } from 'date-fns/formatDistance';
import migrationService from '../services/migrationService';
import { auth } from '../../lib/firebaseConfig';
export default function SocialFeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  
  // Post creation states
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postPrivacy, setPostPrivacy] = useState<PrivacyLevel>(PrivacyLevel.PUBLIC);
  const [isUploading, setIsUploading] = useState(false);
  
  // Comment states
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [currentPost, setCurrentPost] = useState<SocialPost | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsUnsubscribe, setCommentsUnsubscribe] = useState<(() => void) | null>(null);
  const [postsUnsubscribe, setPostsUnsubscribe] = useState<(() => void) | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Initialize database and fetch posts
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        // Initialize database (creates user document if needed)
        await migrationService.initializeDatabase();
        
        // For development, seed initial data if needed
        if (__DEV__) {
          await migrationService.seedInitialData();
        }
        
        // Fetch posts
        fetchPosts();
      } catch (error) {
        console.error('Error initializing feed:', error);
        // Fetch posts anyway even if initialization fails
        fetchPosts();
      }
    };
    
    initializeAndFetch();
    
    // Cleanup function
    return () => {
      // Clean up any active listeners
      if (commentsUnsubscribe) {
        commentsUnsubscribe();
      }
      if (postsUnsubscribe) {
        postsUnsubscribe();
      }
    };
  }, [commentsUnsubscribe, postsUnsubscribe]);

  // Fetch posts from service
  const fetchPosts = async (refresh = false) => {
    try {
      setIsLoading(true);
      
      // If refreshing, reset pagination
      if (refresh) {
        setLastDoc(null);
        setHasMorePosts(true);
      }
      
      // Clean up any existing listener
      if (postsUnsubscribe) {
        postsUnsubscribe();
        setPostsUnsubscribe(null);
      }
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.log('No authenticated user found, showing empty feed');
        setPosts([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Initial fetch to get posts immediately
      const options = {
        lastDoc: refresh ? null : lastDoc,
        pageSize: 10
      };
      
      const result = await socialService.fetchPosts(options);
      
      if (result.posts.length < 10) {
        setHasMorePosts(false);
      }
      
      setPosts(refresh ? result.posts : [...posts, ...result.posts]);
      setLastDoc(result.lastDoc);
      
      // Set up real-time listener for posts
      const unsubscribe = socialService.setupPostsListener((updatedPosts) => {
        // Only update if we're not in the middle of pagination
        if (!isLoading && !isRefreshing) {
          setPosts(updatedPosts);
        }
      }, { limit: 20 });
      
      setPostsUnsubscribe(() => unsubscribe);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Show a more specific error message based on the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission')) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to view the feed. The app will continue to work with limited functionality.'
        );
      } else {
        Alert.alert('Error', 'Failed to load posts. Please try again.');
      }
      // Set empty posts array to avoid showing stale data
      setPosts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPosts(true);
  };

  // Load more posts when reaching the end
  const loadMorePosts = () => {
    if (!isLoading && hasMorePosts) {
      fetchPosts();
    }
  };

  // Pick an image from gallery
  const pickImage = async () => {
    try {
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
    }
  };

  // Submit a new post
  const submitPost = async () => {
    if (!postText.trim() && !postImage) {
      Alert.alert('Error', 'Please enter some text or add an image');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Prepare post data
      const postData = {
        userId: user?.id || '',
        userName: user?.name || '',
        userAvatar: user?.avatar,
        content: postText.trim(),
        contentType: postImage ? ContentType.MIXED : ContentType.TEXT,
        privacyLevel: postPrivacy,
        likes: 0,
        comments: 0,
        shares: 0
      };
      
      // Upload media if any
      let mediaFiles = [];
      if (postImage) {
        // The image will be uploaded to Firebase Storage in the socialService
        // The URI is passed to the service which handles the upload
        mediaFiles.push(postImage);
      }
      
      // Create the post
      const newPost = await socialService.createPost(postData, mediaFiles);
      
      // Add to posts list and reset form
      setPosts([newPost, ...posts]);
      setPostText('');
      setPostImage(null);
      setIsCreatingPost(false);
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Like a post
  const handleLikePost = async (postId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to like posts');
      return;
    }
    
    try {
      // Optimistic update
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return { ...post, likes: post.likes + 1 };
        }
        return post;
      }));
      
      // Call API
      await socialService.likePost(postId);
      
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return { ...post, likes: post.likes - 1 };
        }
        return post;
      }));
    }
  };

  // View comments for a post
  const viewComments = async (post: SocialPost) => {
    setCurrentPost(post);
    setShowComments(true);
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
    if (!currentPost || !commentText.trim()) return;
    
    try {
      // Create a new comment
      const newComment = {
        id: Date.now().toString(),
        userName: user?.name || 'Anonymous',
        content: commentText,
        createdAt: new Date()
      };
      
      // Add to comments list
      setComments([...comments, newComment]);
      setCommentText('');
      
      // Increment comment count on post
      setPosts(posts.map(post => {
        if (post.id === currentPost.id) {
          return { ...post, comments: post.comments + 1 };
        }
        return post;
      }));
      
      // Update current post
      setCurrentPost({
        ...currentPost,
        comments: currentPost.comments + 1
      });
      
      // Save the comment to Firestore
      await socialService.commentOnPost(currentPost.id, commentText);
      
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Share a post
  const sharePost = async (post: SocialPost) => {
    try {
      // Call the Firestore service to share the post
      await socialService.sharePost(post.id);
      
      // Show success message
      Alert.alert('Success', 'Post shared successfully');
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    }
  };

  // Format the timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // Render each post item
  function renderPostItem({ item }: { item: SocialPost; }) {
    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          {item.userAvatar ? (
            <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.avatarInitial}>{item.userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.postHeaderInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.postTime}>{formatTimestamp(item.createdAt)}</Text>
          </View>

          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-horiz" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          {item.content && (
            <Text style={styles.postText}>{item.content}</Text>
          )}

          {item.mediaUrls && item.mediaUrls.length > 0 && (
            <Image
              source={{ uri: item.mediaUrls[0] }}
              style={styles.postImage}
              resizeMode="cover" />
          )}
        </View>

        {/* Post Metrics */}
        <View style={styles.postMetrics}>
          <Text style={styles.likeCount}>{item.likes} likes</Text>
          <Text style={styles.commentCount}>{item.comments} comments</Text>
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePost(item.id)}
          >
            <FontAwesome name="thumbs-o-up" size={20} color="#6B7280" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => viewComments(item)}
          >
            <FontAwesome name="comment-o" size={20} color="#6B7280" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => sharePost(item)}
          >
            <FontAwesome name="share" size={20} color="#6B7280" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render post creation form
  const renderPostCreation = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.createPostCard}>
        <View style={styles.createPostHeader}>
          <TouchableOpacity onPress={() => setIsCreatingPost(false)}>
            <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.createPostTitle}>Create Post</Text>
          <TouchableOpacity 
            style={[styles.postButton, (!postText.trim() && !postImage) && styles.postButtonDisabled]}
            onPress={submitPost}
            disabled={isUploading || (!postText.trim() && !postImage)}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.createPostContent}>
          <View style={styles.createPostUser}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <View style={styles.privacySelector}>
                <MaterialIcons name="public" size={16} color="#6B7280" />
                <Text style={styles.privacyText}>Public</Text>
                <MaterialIcons name="arrow-drop-down" size={16} color="#6B7280" />
              </View>
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
    </KeyboardAvoidingView>
  );

  // Render comments modal
  const renderCommentsModal = () => (
    <Modal
      visible={showComments}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        // Clean up comments listener when closing modal
        if (commentsUnsubscribe) {
          commentsUnsubscribe();
          setCommentsUnsubscribe(null);
        }
        setShowComments(false);
      }}
    >
      <View style={styles.commentsContainer}>
        <View style={styles.commentsHeader}>
          <TouchableOpacity onPress={() => {
            // Clean up comments listener when closing modal
            if (commentsUnsubscribe) {
              commentsUnsubscribe();
              setCommentsUnsubscribe(null);
            }
            setShowComments(false);
          }}>
            <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.commentsTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Original post summary */}
        {currentPost && (
          <View style={styles.originalPost}>
            <View style={styles.postHeader}>
              {currentPost.userAvatar ? (
                <Image source={{ uri: currentPost.userAvatar }} style={styles.userAvatarSmall} />
              ) : (
                <View style={styles.userAvatarSmallPlaceholder}>
                  <Text style={styles.avatarInitialSmall}>
                    {currentPost.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <View style={styles.postHeaderInfo}>
                <Text style={styles.userName}>{currentPost.userName}</Text>
                <Text style={styles.postTime}>{formatTimestamp(currentPost.createdAt)}</Text>
              </View>
            </View>
            
            <Text style={styles.originalPostText} numberOfLines={2}>
              {currentPost.content}
            </Text>
          </View>
        )}
        
        {/* Comments list */}
        {isLoadingComments ? (
          <ActivityIndicator style={styles.loadingIndicator} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <View style={styles.userAvatarSmallPlaceholder}>
                  <Text style={styles.avatarInitialSmall}>
                    {item.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUserName}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                  <Text style={styles.commentTime}>{formatTimestamp(item.createdAt)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
            }
            contentContainerStyle={styles.commentsList}
          />
        )}
        
        {/* Comment input */}
        <View style={styles.commentInputContainer}>
          <TextInput
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
            <MaterialIcons name="send" size={20} color={commentText.trim() ? "#007AFF" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Main component render
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Feed</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('//screens/search')}
        >
          <MaterialIcons name="search" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
      
      {/* Create post button */}
      {!isCreatingPost && (
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => setIsCreatingPost(true)}
        >
          <View style={styles.createPostPrompt}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.userAvatarSmall} />
            ) : (
              <View style={styles.userAvatarSmallPlaceholder}>
                <Text style={styles.avatarInitialSmall}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
            <Text style={styles.createPostPromptText}>What's on your mind?</Text>
          </View>
          <View style={styles.createPostOptions}>
            <TouchableOpacity style={styles.postOptionButton}>
              <MaterialIcons name="photo" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Post creation form or post list */}
      {isCreatingPost ? (
        renderPostCreation()
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.postList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator style={styles.loadingIndicator} size="large" color="#007AFF" />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="forum" size={60} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
                <Text style={styles.emptyStateText}>
                  Be the first to share something with the community!
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            hasMorePosts && posts.length > 0 && !isRefreshing ? (
              <ActivityIndicator style={styles.paginationLoader} />
            ) : null
          }
        />
      )}
      
      {/* Comments modal */}
      {renderCommentsModal()}
    </View>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    ...cardShadow,
  },
  createPostPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostPromptText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  createPostOptions: {
    flexDirection: 'row',
  },
  postOptionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createPostCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    ...cardShadow,
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    ...buttonShadow,
  },
  postButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createPostContent: {
    padding: 16,
  },
  createPostUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
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
  createPostActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
  },
  mediaButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4B5563',
  },
  postList: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    ...cardShadow,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarInitialSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    padding: 12,
    paddingTop: 0,
  },
  postText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  postMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  likeCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  commentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingIndicator: {
    padding: 20,
  },
  paginationLoader: {
    padding: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
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
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  originalPost: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  originalPostText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
  },
  commentsList: {
    padding: 16,
    paddingBottom: 80,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    ...Platform.select({
      ios: {
        paddingBottom: 30
      }
    })
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });