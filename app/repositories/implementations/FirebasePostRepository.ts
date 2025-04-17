// app/repositories/implementations/FirebasePostRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../../../lib/firebaseConfig';
import { FirebaseRepository } from './FirebaseRepository';
import { IPostRepository } from '../interfaces/IPostRepository';
import { SocialPost, ContentType, PrivacyLevel } from '../../models/social';
import { sanitizeForFirestore } from '../../services/migrationService';

/**
 * Firebase implementation of the Post Repository
 */
export class FirebasePostRepository extends FirebaseRepository<SocialPost> implements IPostRepository {
  constructor() {
    super('socialPosts');
  }

  /**
   * Fetch posts with advanced filtering
   * @param options Filtering options
   * @returns Promise resolving to posts and last document for pagination
   */
  async fetchPosts(
    options: {
      userId?: string;
      connectionIds?: string[];
      contentTypes?: ContentType[];
      privacyLevel?: PrivacyLevel;
      lastDoc?: any;
      pageSize?: number;
    } = {}
  ): Promise<{ posts: SocialPost[]; lastDoc: any }> {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found during fetchPosts');
        return { posts: [], lastDoc: null };
      }
      
      let postsQuery = query(this.collectionRef, orderBy('createdAt', 'desc'));
      
      // Apply filters based on options
      if (options.userId) {
        postsQuery = query(postsQuery, where('userId', '==', options.userId));
      }
      
      if (options.connectionIds && options.connectionIds.length > 0) {
        // Firestore "in" queries are limited to 10 values
        if (options.connectionIds.length <= 10) {
          postsQuery = query(postsQuery, where('userId', 'in', options.connectionIds));
        } else {
          // For more than 10 connections, we'll need to do multiple queries and combine results
          // This is a limitation of Firestore
          console.warn('More than 10 connections provided, only using first 10');
          postsQuery = query(postsQuery, where('userId', 'in', options.connectionIds.slice(0, 10)));
        }
      }
      
      if (options.contentTypes && options.contentTypes.length > 0) {
        postsQuery = query(postsQuery, where('contentType', 'in', options.contentTypes));
      }
      
      if (options.privacyLevel) {
        postsQuery = query(postsQuery, where('privacyLevel', '==', options.privacyLevel));
      } else {
        // By default, only show public posts
        postsQuery = query(postsQuery, where('privacyLevel', '==', PrivacyLevel.PUBLIC));
      }
      
      // Pagination
      const pageSize = options.pageSize || 10;
      postsQuery = query(postsQuery, limit(pageSize));
      
      if (options.lastDoc) {
        postsQuery = query(postsQuery, startAfter(options.lastDoc));
      }
      
      const querySnapshot = await getDocs(postsQuery);
      const posts: SocialPost[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          // Ensure createdAt is a Timestamp (handle serverTimestamp)
          createdAt: data.createdAt || Timestamp.now()
        } as SocialPost);
      });
      
      const lastDoc = querySnapshot.docs.length > 0 
        ? querySnapshot.docs[querySnapshot.docs.length - 1] 
        : null;
      
      return { posts, lastDoc };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Set up a real-time listener for posts
   * @param callback Function to call when posts change
   * @param options Filtering options
   * @returns Unsubscribe function to stop listening
   */
  setupPostsListener(
    callback: (posts: SocialPost[]) => void,
    options: {
      userId?: string;
      limit?: number;
    } = {}
  ): () => void {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found during setupPostsListener');
        callback([]);
        // Return a no-op function as unsubscribe
        return () => {};
      }
      
      let postsQuery = query(
        this.collectionRef, 
        orderBy('createdAt', 'desc'),
        limit(options.limit || 20)
      );
      
      if (options.userId) {
        postsQuery = query(postsQuery, where('userId', '==', options.userId));
      }
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const posts: SocialPost[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || Timestamp.now()
          } as SocialPost);
        });
        
        callback(posts);
      }, (error) => {
        console.error('Error in posts listener:', error);
      });
      
      // Return unsubscribe function to clean up listener
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up posts listener:', error);
      throw error;
    }
  }

  /**
   * Like or unlike a post
   * @param postId Post ID
   * @param userId User ID
   * @returns Promise resolving when the operation is complete
   */
  async likePost(postId: string, userId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const postRef = doc(db, 'socialPosts', postId);
      const likeRef = doc(db, 'socialPosts', postId, 'likes', userId);
      
      // Check if already liked
      const likeDoc = await getDoc(likeRef);
      
      const batch = writeBatch(db);
      
      if (!likeDoc.exists()) {
        // Add like
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        batch.set(likeRef, {
          userId: userId,
          userName: userData?.displayName || 'Anonymous',
          userAvatar: userData?.photoURL || null,
          createdAt: serverTimestamp()
        });
        
        // Increment post like count
        batch.update(postRef, {
          likes: increment(1)
        });
        
        // Create notification for post owner
        const postDoc = await getDoc(postRef);
        const postData = postDoc.data();
        
        if (postData && postData.userId !== userId) {
          const notificationData = {
            userId: postData.userId,
            type: 'like',
            relatedUserId: userId,
            relatedUserName: userData?.displayName || 'Anonymous',
            relatedUserAvatar: userData?.photoURL || null,
            relatedPostId: postId,
            read: false,
            createdAt: serverTimestamp()
          };
          
          // Sanitize notification data
          const sanitizedNotificationData = sanitizeForFirestore(notificationData);
          
          const notificationRef = doc(collection(db, 'notifications'));
          batch.set(notificationRef, sanitizedNotificationData);
        }
      } else {
        // Unlike
        batch.delete(likeRef);
        
        // Decrement post like count
        batch.update(postRef, {
          likes: increment(-1)
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  /**
   * Share a post
   * @param postId Post ID to share
   * @param userId User ID sharing the post
   * @param content Optional comment on the share
   * @returns Promise resolving to the ID of the new shared post
   */
  async sharePost(postId: string, userId: string, content: string = ''): Promise<string> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Get the original post
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Use a batch write for atomicity
      const batch = writeBatch(db);
      
      // Increment share count on original post
      batch.update(postRef, {
        shares: increment(1)
      });
      
      // Create a new post as a share
      const sharePostData = {
        userId: userId,
        userName: userData?.displayName || 'Anonymous',
        userAvatar: userData?.photoURL || null,
        content: content, // Optional comment on the share
        contentType: ContentType.MIXED,
        privacyLevel: PrivacyLevel.PUBLIC,
        originalPost: {
          id: postId,
          userId: postData.userId,
          userName: postData.userName,
          userAvatar: postData.userAvatar,
          content: postData.content,
          mediaUrls: postData.mediaUrls,
          createdAt: postData.createdAt
        },
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0
      };
      
      // Sanitize the share post data
      const sanitizedSharePostData = sanitizeForFirestore(sharePostData);
      
      const sharePostRef = doc(collection(db, 'socialPosts'));
      batch.set(sharePostRef, sanitizedSharePostData);
      
      // Create notification for original post owner
      if (postData.userId !== userId) {
        const notificationData = {
          userId: postData.userId,
          type: 'share',
          relatedUserId: userId,
          relatedUserName: userData?.displayName || 'Anonymous',
          relatedUserAvatar: userData?.photoURL || null,
          relatedPostId: postId,
          read: false,
          createdAt: serverTimestamp()
        };
        
        // Sanitize notification data
        const sanitizedNotificationData = sanitizeForFirestore(notificationData);
        
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, sanitizedNotificationData);
      }
      
      // Commit the batch
      await batch.commit();
      
      return sharePostRef.id;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  /**
   * Generate a shareable link for a post
   * @param postId Post ID
   * @returns Promise resolving to the shareable link
   */
  async generateShareableLink(postId: string): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get the post to verify it exists and check privacy settings
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      
      // Check if post is public (only public posts can be shared externally)
      if (postData.privacyLevel !== PrivacyLevel.PUBLIC) {
        throw new Error('Only public posts can be shared with external links');
      }
      
      // Create a dynamic link using the app's domain
      // In a real implementation, you would use Firebase Dynamic Links or a similar service
      // For this implementation, we'll create a simple URL that can be used within the app
      
      // Base URL for the app (would be configured in a real app)
      const appBaseUrl = 'https://scango-app.com';
      
      // Create a shareable link with the post ID
      const shareableLink = `${appBaseUrl}/post/${postId}`;
      
      // Increment the share count on the post
      await updateDoc(postRef, {
        shares: increment(1)
      });
      
      // Create notification for post owner if it's not the current user
      if (postData.userId !== currentUser.uid) {
        const notificationData = {
          userId: postData.userId,
          type: 'share',
          relatedUserId: currentUser.uid,
          relatedUserName: currentUser.displayName || 'Anonymous',
          relatedUserAvatar: currentUser.photoURL || null,
          relatedPostId: postId,
          read: false,
          createdAt: serverTimestamp()
        };
        
        // Sanitize notification data
        const sanitizedNotificationData = sanitizeForFirestore(notificationData);
        
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, sanitizedNotificationData);
      }
      
      return shareableLink;
    } catch (error) {
      console.error('Error generating shareable link:', error);
      throw error;
    }
  }

  /**
   * Override the delete method to handle media deletion
   * @param postId Post ID to delete
   * @returns Promise resolving when the post is deleted
   */
  async delete(postId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get post data to check ownership
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      
      // Verify ownership
      if (postData.userId !== currentUser.uid) {
        throw new Error('Not authorized to delete this post');
      }
      
      const batch = writeBatch(db);
      
      // Delete post
      batch.delete(postRef);
      
      // Update user's post count
      const userRef = doc(db, 'users', currentUser.uid);
      batch.update(userRef, {
        totalPosts: increment(-1)
      });
      
      // Delete associated media from storage if any
      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        // Note: Storage deletion is not part of the batch
        // We'll handle it separately after batch commit
        const mediaUrls = postData.mediaUrls;
        
        // Commit batch first
        await batch.commit();
        
        // Then delete media files
        for (const url of mediaUrls) {
          // Extract the path from the URL outside the try block
          const path = url.split('?')[0].split('/o/')[1];
          if (!path) {
            console.warn(`Could not extract storage path from URL: ${url}`);
            continue;
          }
          
          const decodedPath = decodeURIComponent(path);
          
          try {
            const storageRef = ref(storage, decodedPath);
            await deleteObject(storageRef);
          } catch (storageError) {
            console.error('Error deleting media file:', storageError);
            // Continue with other deletions even if one fails
          }
        }
      } else {
        // No media to delete, just commit the batch
        await batch.commit();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}