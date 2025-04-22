import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../AuthContext';
import socialService from '../services/socialService';
import { SocialPost, PrivacyLevel } from '../models/social';
import migrationService from '../services/migrationService';
import { auth } from '../../lib/firebaseConfig';
import { useSocialPosts } from './useSocialPosts';
import debounce from 'lodash/debounce';

export interface FeedManagerOptions {
  pageSize?: number;
  initialRefresh?: boolean;
}

export function useFeedManager(options: FeedManagerOptions = {}) {
  const { pageSize = 10, initialRefresh = false } = options;
  const { user } = useAuth();
  
  // Posts state
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  
  // Listeners state
  const [postsUnsubscribe, setPostsUnsubscribe] = useState<(() => void) | null>(null);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent memory leaks
  const isMounted = useRef(true);
  
  // Use the social posts hook for post creation and image uploads
  const {
    createPost,
    isLoading: isPostLoading,
    isUploading,
    uploadProgress
  } = useSocialPosts();
  
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
        if (initialRefresh) {
          await fetchPosts(true);
        } else {
          await fetchPosts();
        }
      } catch (error) {
        console.error('Error initializing feed:', error);
        if (isMounted.current) {
          setError('Failed to initialize feed. Please try again.');
          // Fetch posts anyway even if initialization fails
          fetchPosts();
        }
      }
    };
    
    initializeAndFetch();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      // Clean up any active listeners
      if (postsUnsubscribe) {
        postsUnsubscribe();
      }
    };
  }, []);
  
  // Debounced fetch posts function to prevent multiple calls
  const debouncedFetchPosts = useCallback(
    debounce((refresh: boolean = false) => {
      fetchPosts(refresh);
    }, 300),
    []
  );
  
  // Fetch posts from service
  const fetchPosts = async (refresh = false) => {
    try {
      if (!isMounted.current) return;
      
      setIsLoading(true);
      setError(null);
      
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
        if (isMounted.current) {
          setPosts([]);
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }
      
      // Initial fetch to get posts immediately
      const options = {
        lastDoc: refresh ? null : lastDoc,
        pageSize
      };
      
      const result = await socialService.fetchPosts(options);
      
      if (!isMounted.current) return;
      
      if (result.posts.length < pageSize) {
        setHasMorePosts(false);
      }
      
      // Ensure unique posts by ID to prevent duplicate key warnings
      if (refresh) {
        setPosts(result.posts);
      } else {
        // Create a map of existing posts by ID
        const existingPostsMap = new Map(posts.map(post => [post.id, post]));
        
        // Add new posts only if they don't already exist
        const updatedPosts = [...posts];
        result.posts.forEach(post => {
          if (!existingPostsMap.has(post.id)) {
            updatedPosts.push(post);
          }
        });
        
        setPosts(updatedPosts);
      }
      
      setLastDoc(result.lastDoc);
      
      // Set up real-time listener for posts
      const unsubscribe = socialService.setupPostsListener((updatedPosts) => {
        // Only update if we're not in the middle of pagination
        if (isMounted.current && !isLoading && !isRefreshing) {
          setPosts(updatedPosts);
        }
      }, { limit: 20 });
      
      setPostsUnsubscribe(() => unsubscribe);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (!isMounted.current) return;
      
      // Show a more specific error message based on the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      
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
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };
  
  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts(true);
  }, []);
  
  // Load more posts when reaching the end
  const loadMorePosts = useCallback(() => {
    if (!isLoading && hasMorePosts) {
      debouncedFetchPosts(false);
    }
  }, [isLoading, hasMorePosts, debouncedFetchPosts]);
  
  // Like a post (toggle like/unlike)
  const handleLikePost = useCallback(async (postId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to like posts');
      return;
    }
    
    // Find the post to determine if it's already liked
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Check if the post is already liked by this user
    const isLiked = post.userLikes?.includes(user.id);
    
    // Track if the like operation failed
    let likeFailed = false;
    
    try {
      // Optimistic update
      setPosts(posts.map(post => {
        if (post.id === postId) {
          // Update likes count and user likes array
          const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
          const newUserLikes = isLiked
            ? (post.userLikes || []).filter(id => id !== user.id)
            : [...(post.userLikes || []), user.id];
            
          return {
            ...post,
            likes: newLikes,
            userLikes: newUserLikes
          };
        }
        return post;
      }));
      
      // Call API
      await socialService.likePost(postId);
      
    } catch (error) {
      console.error('Error toggling like on post:', error);
      likeFailed = true;
      
      // Revert on error
      setPosts(posts.map(post => {
        if (post.id === postId) {
          // Revert to original state
          const newLikes = isLiked ? post.likes + 1 : post.likes - 1;
          const newUserLikes = isLiked
            ? [...(post.userLikes || []), user.id]
            : (post.userLikes || []).filter(id => id !== user.id);
            
          return {
            ...post,
            likes: newLikes,
            userLikes: newUserLikes,
            likeError: true
          };
        }
        return post;
      }));
      
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to like post';
      setError(`Like operation failed: ${errorMessage}`);
    }
    
    // Clear the like error after 3 seconds
    if (likeFailed) {
      setTimeout(() => {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const { likeError, ...rest } = post;
            return rest;
          }
          return post;
        }));
        setError(null);
      }, 3000);
    }
  }, [posts, user]);
  
  // Share a post
  const sharePost = useCallback(async (post: SocialPost) => {
    try {
      // Generate a shareable link for the post
      const shareableLink = await socialService.generateShareableLink(post.id);
      
      return {
        message: `Check out this post from ${post.userName}: ${shareableLink}`,
        url: shareableLink,
        title: 'Share Post'
      };
    } catch (error) {
      console.error('Error generating shareable link:', error);
      
      // Show more specific error message based on the error type
      if (error instanceof Error) {
        if (error.message.includes('privacy')) {
          Alert.alert('Privacy Restriction', 'Only public posts can be shared with external links.');
        } else {
          Alert.alert('Error', `Failed to share post: ${error.message}`);
        }
      } else {
        Alert.alert('Error', 'Failed to share post. Please try again.');
      }
      
      throw error;
    }
  }, []);
  
  // Update post after successful share
  const updatePostShareCount = useCallback((postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, shares: p.shares + 1 };
      }
      return p;
    }));
  }, [posts]);
  
  // Add a new post to the list
  const addPostToList = useCallback((newPost: SocialPost) => {
    setPosts([newPost, ...posts]);
  }, [posts]);
  
  return {
    // State
    posts,
    isLoading,
    isRefreshing,
    hasMorePosts,
    error,
    isPostLoading,
    isUploading,
    uploadProgress,
    
    // Post creation
    createPost,
    addPostToList,
    
    // Post interactions
    handleLikePost,
    sharePost,
    updatePostShareCount,
    
    // Pagination
    handleRefresh,
    loadMorePosts,
    fetchPosts,
  };
}