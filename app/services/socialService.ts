// app/services/socialService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
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
  deleteField,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, storage } from '../../lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { sanitizeForFirestore } from './migrationService';
import { imageUploadService } from './imageUploadService';
import { 
  SocialPost, 
  Connection, 
  ConnectionStatus, 
  SocialProfile, 
  ContentType, 
  PrivacyLevel,
  SocialNotification,
  Comment
} from '../models/social';
import NetInfo from '@react-native-community/netinfo';
import { enableIndexedDbPersistence, disableNetwork, enableNetwork } from 'firebase/firestore';

// Initialize offline persistence
try {
  enableIndexedDbPersistence(db)
    .then(() => console.log('Offline persistence enabled'))
    .catch(error => {
      if (error.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (error.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      } else {
        console.error('Error enabling offline persistence:', error);
      }
    });
} catch (error) {
  console.error('Error initializing persistence:', error);
}

// Monitor network status
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    enableNetwork(db)
      .then(() => console.log('Firestore online mode enabled'))
      .catch(error => console.error('Error enabling online mode:', error));
  } else {
    disableNetwork(db)
      .then(() => console.log('Firestore offline mode enabled'))
      .catch(error => console.error('Error enabling offline mode:', error));
  }
});

class SocialService {
  // Post Creation and Management
  async createPost(postData: Omit<SocialPost, 'id' | 'createdAt'>, mediaFiles?: File[] | string[]): Promise<SocialPost> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles && mediaFiles.length > 0) {
        try {
          // Filter out only string URIs (from expo-image-picker)
          const stringMediaFiles = mediaFiles.filter(file => typeof file === 'string') as string[];
          
          // Use the unified image upload service for multiple files
          if (stringMediaFiles.length > 0) {
            const uploadResult = await imageUploadService.uploadPostImages(
              currentUser.uid,
              stringMediaFiles,
              undefined, // No post ID yet
              (progress) => {
                // Optional: Handle overall progress updates
                console.log(`Post images upload progress: ${progress * 100}%`);
              }
            );
            
            // Add successful uploads to mediaUrls
            mediaUrls = uploadResult.urls;
            
            // Log any errors that occurred during upload
            if (uploadResult.errors.length > 0) {
              console.warn(`${uploadResult.errors.length} images failed to upload`);
              uploadResult.errors.forEach(err => {
                console.error(`Error uploading image at index ${err.index}:`, err.error);
              });
              
              // If all uploads failed, throw an error
              if (mediaUrls.length === 0 && uploadResult.errors.length > 0) {
                throw new Error('Failed to upload any media files. Please try again with different images.');
              }
            }
          }
          
          // Handle File objects if any (for web platform)
          const fileObjects = mediaFiles.filter(file => typeof file !== 'string') as File[];
          if (fileObjects.length > 0) {
            // This would need a different approach for File objects
            // For now, we'll just log a warning
            console.warn('File object uploads not implemented in unified service yet');
          }
        } catch (uploadError) {
          console.error('Error uploading media files:', uploadError);
          throw new Error(`Failed to upload media: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
  
      // Prepare post data
      const postToSave = {
        ...postData,
        userId: currentUser.uid,
        userName: postData.userName || currentUser.displayName || 'Anonymous',
        userAvatar: postData.userAvatar || currentUser.photoURL || null,
        mediaUrls: mediaUrls,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0
      };
  
      // Save to Firestore with batch write for atomicity
      const batch = writeBatch(db);
      
      // Sanitize the post data to remove any undefined values
      const sanitizedPostData = sanitizeForFirestore(postToSave);
      
      // Add post document
      const postRef = doc(collection(db, 'socialPosts'));
      batch.set(postRef, sanitizedPostData);
      
      // Update user's post count
      const userRef = doc(db, 'users', currentUser.uid);
      batch.update(userRef, {
        totalPosts: increment(1)
      });
      
      await batch.commit();
      
      // Return the created post with the generated ID
      return { 
        id: postRef.id, 
        ...postToSave,
        createdAt: Timestamp.now() // Replace serverTimestamp with current timestamp for immediate use
      } as SocialPost;
    } catch (error) {
      console.error('Error creating post:', error);
      
      // Provide more specific error messages based on the type of error
      if (error instanceof Error) {
        // Check if it's a media upload error
        if (error.message.includes('media') || error.message.includes('upload') || error.message.includes('storage')) {
          throw new Error(`Failed to upload media: ${error.message}. Please try again with a different file or smaller file size.`);
        }
        
        // Check if it's a Firestore error
        if (error.message.includes('firestore') || error.message.includes('permission') || error.message.includes('document')) {
          throw new Error(`Failed to save post: ${error.message}. Please check your connection and try again.`);
        }
      }
      
      // Generic error if we can't determine the specific type
      throw new Error('Failed to create post. Please try again later.');
    }
  }

  // Fetch Posts with Advanced Filtering
  async fetchPosts(
    options: {
      userId?: string,
      connectionIds?: string[],
      contentTypes?: ContentType[],
      privacyLevel?: PrivacyLevel,
      lastDoc?: any,
      pageSize?: number
    } = {}
  ): Promise<{ posts: SocialPost[], lastDoc: any }> {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found during fetchPosts');
        return { posts: [], lastDoc: null };
      }
      
      const postsRef = collection(db, 'socialPosts');
      let postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      
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

  // Set up real-time posts listener
  setupPostsListener(
    callback: (posts: SocialPost[]) => void,
    options: {
      userId?: string,
      limit?: number
    } = {}
  ) {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found during setupPostsListener');
        callback([]);
        // Return a no-op function as unsubscribe
        return () => {};
      }
      const postsRef = collection(db, 'socialPosts');
      let postsQuery = query(
        postsRef, 
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

  // Like a post
  async likePost(postId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const postRef = doc(db, 'socialPosts', postId);
      const likeRef = doc(db, 'socialPosts', postId, 'likes', currentUser.uid);
      
      // Check if already liked
      const likeDoc = await getDoc(likeRef);
      
      const batch = writeBatch(db);
      
      if (!likeDoc.exists()) {
        // Add like
        batch.set(likeRef, {
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Anonymous',
          userAvatar: currentUser.photoURL || null,
          createdAt: serverTimestamp()
        });
        
        // Increment post like count
        batch.update(postRef, {
          likes: increment(1)
        });
        
        // Create notification for post owner
        const postDoc = await getDoc(postRef);
        const postData = postDoc.data();
        
        if (postData && postData.userId !== currentUser.uid) {
          const notificationData = {
            userId: postData.userId,
            type: 'like',
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

  // Comment on a post
  async commentOnPost(
    postId: string, 
    content: string, 
    parentCommentId?: string
  ): Promise<Comment> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Create comment data
      const commentData = {
        postId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userAvatar: currentUser.photoURL || null,
        content,
        createdAt: serverTimestamp(),
        likes: 0,
        parentCommentId
      };
      
      // Use a batch write for atomicity
      const batch = writeBatch(db);
      
      // Sanitize the comment data to remove any undefined values
      const sanitizedCommentData = sanitizeForFirestore(commentData);
      
      // Add the comment
      const commentRef = doc(collection(db, 'socialPosts', postId, 'comments'));
      batch.set(commentRef, sanitizedCommentData);
      
      // Increment comment count on the post
      const postRef = doc(db, 'socialPosts', postId);
      batch.update(postRef, {
        comments: increment(1)
      });
      
      // Create notification for post owner (if not self-comment)
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();
      
      if (postData && postData.userId !== currentUser.uid) {
        const notificationData = {
          userId: postData.userId,
          type: 'comment',
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
        batch.set(notificationRef, sanitizedNotificationData);
      }
      
      // If this is a reply to another comment, notify that comment's author
      if (parentCommentId) {
        const parentCommentRef = doc(db, 'socialPosts', postId, 'comments', parentCommentId);
        const parentCommentDoc = await getDoc(parentCommentRef);
        
        if (parentCommentDoc.exists() && parentCommentDoc.data().userId !== currentUser.uid) {
          const replyNotificationData = {
            userId: parentCommentDoc.data().userId,
            type: 'reply',
            relatedUserId: currentUser.uid,
            relatedUserName: currentUser.displayName || 'Anonymous',
            relatedUserAvatar: currentUser.photoURL || null,
            relatedPostId: postId,
            relatedCommentId: parentCommentId,
            read: false,
            createdAt: serverTimestamp()
          };
          
          // Sanitize notification data
          const sanitizedReplyNotificationData = sanitizeForFirestore(replyNotificationData);
          
          const replyNotificationRef = doc(collection(db, 'notifications'));
          batch.set(replyNotificationRef, sanitizedReplyNotificationData);
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      // Return the created comment with the generated ID
      return { 
        id: commentRef.id, 
        ...commentData,
        createdAt: Timestamp.now() // Replace serverTimestamp with current timestamp for immediate use
      } as Comment;
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw error;
    }
  }

  // Get comments for a post
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'socialPosts', postId, 'comments');
      const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));
      
      const querySnapshot = await getDocs(commentsQuery);
      const comments: Comment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now()
        } as Comment);
      });
      
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Set up real-time comments listener
  setupCommentsListener(postId: string, callback: (comments: Comment[]) => void) {
    try {
      const commentsRef = collection(db, 'socialPosts', postId, 'comments');
      const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const comments: Comment[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          comments.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || Timestamp.now()
          } as Comment);
        });
        
        callback(comments);
      }, (error) => {
        console.error('Error in comments listener:', error);
      });
      
      // Return unsubscribe function to clean up listener
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up comments listener:', error);
      throw error;
    }
  }

  // Share a post
  async sharePost(postId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get the original post
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      
      // Use a batch write for atomicity
      const batch = writeBatch(db);
      
      // Increment share count on original post
      batch.update(postRef, {
        shares: increment(1)
      });
      
      // Create a new post as a share
      const sharePostData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userAvatar: currentUser.photoURL || null,
        content: '', // Optional comment on the share
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
        batch.set(notificationRef, sanitizedNotificationData);
      }
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  // Delete a post
  async deletePost(postId: string): Promise<void> {
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
            
            // Log detailed information about Firebase Storage errors
            if (storageError && typeof storageError === 'object' && 'code' in storageError) {
              const code = (storageError as { code: string }).code;
              console.error(`Firebase Storage error code: ${code}`);
              
              // Handle specific Firebase Storage errors
              if (code === 'storage/object-not-found') {
                console.warn(`File not found in storage: ${decodedPath}`);
              } else if (code === 'storage/unauthorized') {
                console.error(`Not authorized to delete file: ${decodedPath}`);
              }
            }
            
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

  // User Connections Management
  async sendConnectionRequest(userId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Create a unique connection ID (smaller ID first for consistency)
      const connectionId = currentUser.uid < userId 
        ? `${currentUser.uid}_${userId}` 
        : `${userId}_${currentUser.uid}`;
      
      // Check if connection already exists
      const connectionRef = doc(db, 'connections', connectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (connectionDoc.exists()) {
        const connectionData = connectionDoc.data();
        
        // If already connected or pending, don't create a new request
        if (connectionData.status === ConnectionStatus.ACCEPTED) {
          throw new Error('Already connected with this user');
        }
        
        if (connectionData.status === ConnectionStatus.PENDING) {
          throw new Error('Connection request already pending');
        }
        
        if (connectionData.status === ConnectionStatus.BLOCKED) {
          throw new Error('Unable to connect with this user');
        }
      }
      
      // Create connection request data
      const connectionData = {
        userId: currentUser.uid,
        connectionId: userId,
        status: ConnectionStatus.PENDING,
        connectionRequest: {
          sentBy: currentUser.uid,
          sentAt: serverTimestamp()
        }
      };
      
      // Sanitize connection data
      const sanitizedConnectionData = sanitizeForFirestore(connectionData);
      
      // Save to Firestore
      await setDoc(connectionRef, sanitizedConnectionData);
      
      // Create notification data for the recipient
      const notificationData = {
        userId: userId,
        type: 'connection_request',
        relatedUserId: currentUser.uid,
        relatedUserName: currentUser.displayName || 'Anonymous',
        relatedUserAvatar: currentUser.photoURL || null,
        read: false,
        createdAt: serverTimestamp()
      };
      
      // Sanitize notification data
      const sanitizedNotificationData = sanitizeForFirestore(notificationData);
      
      // Save notification to Firestore
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, sanitizedNotificationData);
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  // Accept a connection request
  async acceptConnectionRequest(userId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get the connection ID
      const connectionId = currentUser.uid < userId 
        ? `${currentUser.uid}_${userId}` 
        : `${userId}_${currentUser.uid}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', connectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }
      
      const connectionData = connectionDoc.data();
      
      // Verify it's a pending request sent to the current user
      if (connectionData.status !== ConnectionStatus.PENDING) {
        throw new Error('No pending connection request');
      }
      
      if (connectionData.connectionRequest?.sentBy === currentUser.uid) {
        throw new Error('Cannot accept your own connection request');
      }
      
      // Update connection status
      await updateDoc(connectionRef, {
        status: ConnectionStatus.ACCEPTED,
        connectionDate: serverTimestamp(),
        lastInteraction: serverTimestamp()
      });
      
      // Create notification data for the sender
      const notificationData = {
        userId: userId,
        type: 'connection_accepted',
        relatedUserId: currentUser.uid,
        relatedUserName: currentUser.displayName || 'Anonymous',
        relatedUserAvatar: currentUser.photoURL || null,
        read: false,
        createdAt: serverTimestamp()
      };
      
      // Sanitize notification data
      const sanitizedNotificationData = sanitizeForFirestore(notificationData);
      
      // Save notification to Firestore
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, sanitizedNotificationData);
      
      // Update follower/following counts for both users
      const batch = writeBatch(db);
      
      // Update current user's following count
      const currentUserRef = doc(db, 'users', currentUser.uid);
      batch.update(currentUserRef, {
        following: increment(1)
      });
      
      // Update other user's followers count
      const otherUserRef = doc(db, 'users', userId);
      batch.update(otherUserRef, {
        followers: increment(1)
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  }

  // Decline a connection request
  async declineConnectionRequest(userId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get the connection ID
      const connectionId = currentUser.uid < userId 
        ? `${currentUser.uid}_${userId}` 
        : `${userId}_${currentUser.uid}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', connectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }
      
      const connectionData = connectionDoc.data();
      
      // Verify it's a pending request sent to the current user
      if (connectionData.status !== ConnectionStatus.PENDING) {
        throw new Error('No pending connection request');
      }
      
      if (connectionData.connectionRequest?.sentBy === currentUser.uid) {
        throw new Error('Cannot decline your own connection request');
      }
      
      // Update connection status
      await updateDoc(connectionRef, {
        status: ConnectionStatus.DECLINED,
        lastInteraction: serverTimestamp()
      });
    } catch (error) {
      console.error('Error declining connection request:', error);
      throw error;
    }
  }

  // Remove a connection
  async removeConnection(userId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Get the connection ID
      const connectionId = currentUser.uid < userId 
        ? `${currentUser.uid}_${userId}` 
        : `${userId}_${currentUser.uid}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', connectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection not found');
      }
      
      const connectionData = connectionDoc.data();
      
      // Verify it's an accepted connection
      if (connectionData.status !== ConnectionStatus.ACCEPTED) {
        throw new Error('Not connected with this user');
      }
      
      // Delete the connection
      await deleteDoc(connectionRef);
      
      // Update follower/following counts for both users
      const batch = writeBatch(db);
      
      // Update current user's following count
      const currentUserRef = doc(db, 'users', currentUser.uid);
      batch.update(currentUserRef, {
        following: increment(-1)
      });
      
      // Update other user's followers count
      const otherUserRef = doc(db, 'users', userId);
      batch.update(otherUserRef, {
        followers: increment(-1)
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  // Get user connections
  async getUserConnections(userId?: string): Promise<Connection[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const targetUserId = userId || currentUser.uid;
      
      // Query connections where the user is either the initiator or the recipient
      const connectionsRef = collection(db, 'connections');
      const connectionsQuery = query(
        connectionsRef,
        where('status', '==', ConnectionStatus.ACCEPTED),
        where('userId', '==', targetUserId)
      );
      
      const querySnapshot = await getDocs(connectionsQuery);
      const connections: Connection[] = [];
      
      querySnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data()
        } as Connection);
      });
      
      // Also get connections where the user is the recipient
      const recipientConnectionsQuery = query(
        connectionsRef,
        where('status', '==', ConnectionStatus.ACCEPTED),
        where('connectionId', '==', targetUserId)
      );
      
      const recipientSnapshot = await getDocs(recipientConnectionsQuery);
      
      recipientSnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data()
        } as Connection);
      });
      
      return connections;
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw error;
    }
  }

  // Get pending connection requests
  async getPendingConnectionRequests(): Promise<Connection[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Query connections where the current user is the recipient of a pending request
      const connectionsRef = collection(db, 'connections');
      const connectionsQuery = query(
        connectionsRef,
        where('status', '==', ConnectionStatus.PENDING),
        where('connectionId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(connectionsQuery);
      const connections: Connection[] = [];
      
      querySnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data()
        } as Connection);
      });
      
      return connections;
    } catch (error) {
      console.error('Error getting pending connection requests:', error);
      throw error;
    }
  }

  // Notifications
  async getNotifications(): Promise<SocialNotification[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      const notifications: SocialNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now()
        } as SocialNotification);
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notificationData = notificationDoc.data();
      
      // Verify ownership
      if (notificationData.userId !== currentUser.uid) {
        throw new Error('Not authorized to update this notification');
      }
      
      // Update notification
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', currentUser.uid),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      
      // Use batch write for efficiency
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notificationData = notificationDoc.data();
      
      // Verify ownership
      if (notificationData.userId !== currentUser.uid) {
        throw new Error('Not authorized to delete this notification');
      }
      
      // Delete notification
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
  // Generate a shareable link for a post
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
}

const socialService = new SocialService();
export default socialService;
