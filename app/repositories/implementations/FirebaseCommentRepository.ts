// app/repositories/implementations/FirebaseCommentRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment,
  serverTimestamp,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../../../lib/firebaseConfig';
import { FirebaseRepository } from './FirebaseRepository';
import { ICommentRepository } from '../interfaces/ICommentRepository';
import { Comment } from '../../models/social';
import { sanitizeForFirestore } from '../../services/migrationService';

/**
 * Firebase implementation of the Comment Repository
 */
export class FirebaseCommentRepository extends FirebaseRepository<Comment> implements ICommentRepository {
  constructor() {
    super('comments');
  }

  /**
   * Get comments for a specific post
   * @param postId Post ID
   * @returns Promise resolving to an array of comments
   */
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

  /**
   * Set up a real-time listener for comments on a post
   * @param postId Post ID
   * @param callback Function to call when comments change
   * @returns Unsubscribe function to stop listening
   */
  setupCommentsListener(
    postId: string,
    callback: (comments: Comment[]) => void
  ): () => void {
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

  /**
   * Add a comment to a post
   * @param postId Post ID
   * @param content Comment content
   * @param userId User ID of the commenter
   * @param userName User name of the commenter
   * @param userAvatar User avatar of the commenter (optional)
   * @param parentCommentId Parent comment ID for replies (optional)
   * @returns Promise resolving to the created comment
   */
  async commentOnPost(
    postId: string,
    content: string,
    userId: string,
    userName: string,
    userAvatar?: string,
    parentCommentId?: string
  ): Promise<Comment> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Create comment data
      const commentData = {
        postId,
        userId,
        userName,
        userAvatar,
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
      
      if (postData && postData.userId !== userId) {
        const notificationData = {
          userId: postData.userId,
          type: 'comment',
          relatedUserId: userId,
          relatedUserName: userName,
          relatedUserAvatar: userAvatar,
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
        
        if (parentCommentDoc.exists() && parentCommentDoc.data().userId !== userId) {
          const replyNotificationData = {
            userId: parentCommentDoc.data().userId,
            type: 'reply',
            relatedUserId: userId,
            relatedUserName: userName,
            relatedUserAvatar: userAvatar,
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

  /**
   * Like a comment
   * @param postId Post ID
   * @param commentId Comment ID
   * @param userId User ID
   * @returns Promise resolving when the operation is complete
   */
  async likeComment(postId: string, commentId: string, userId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const commentRef = doc(db, 'socialPosts', postId, 'comments', commentId);
      const likeRef = doc(db, 'socialPosts', postId, 'comments', commentId, 'likes', userId);
      
      // Check if already liked
      const likeDoc = await getDoc(likeRef);
      
      const batch = writeBatch(db);
      
      if (!likeDoc.exists()) {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // Add like
        batch.set(likeRef, {
          userId: userId,
          userName: userData?.displayName || 'Anonymous',
          userAvatar: userData?.photoURL || null,
          createdAt: serverTimestamp()
        });
        
        // Increment comment like count
        batch.update(commentRef, {
          likes: increment(1)
        });
        
        // Create notification for comment owner
        const commentDoc = await getDoc(commentRef);
        const commentData = commentDoc.data();
        
        if (commentData && commentData.userId !== userId) {
          const notificationData = {
            userId: commentData.userId,
            type: 'comment_like',
            relatedUserId: userId,
            relatedUserName: userData?.displayName || 'Anonymous',
            relatedUserAvatar: userData?.photoURL || null,
            relatedPostId: postId,
            relatedCommentId: commentId,
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
        
        // Decrement comment like count
        batch.update(commentRef, {
          likes: increment(-1)
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }
}