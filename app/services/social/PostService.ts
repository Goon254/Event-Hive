// app/services/social/PostService.ts
import { auth } from '../../../lib/firebaseConfig';
import { RepositoryFactory } from '../../repositories/RepositoryFactory';
import { SocialPost, ContentType, PrivacyLevel } from '../../models/social';
import { imageService } from './ImageService';

/**
 * Service for post-related operations
 */
export class PostService {
  private postRepository = RepositoryFactory.getPostRepository();

  /**
   * Create a new post
   * @param postData Post data
   * @param mediaFiles Optional media files
   * @returns Promise resolving to the created post
   */
  async createPost(
    postData: Omit<SocialPost, 'id'>,
    mediaFiles?: File[] | string[]
  ): Promise<SocialPost> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles && mediaFiles.length > 0) {
        try {
          // Filter out only string URIs (from expo-image-picker)
          const stringMediaFiles = mediaFiles.filter(file => typeof file === 'string') as string[];
          
          // Use the new image service for multiple files
          if (stringMediaFiles.length > 0) {
            const uploadResult = await imageService.uploadPostImages(
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

      // Import Timestamp from Firebase
      const { Timestamp } = require('firebase/firestore');
      
      // Create the post
      const post = await this.postRepository.create({
        ...postData,
        userId: currentUser.uid,
        userName: postData.userName || currentUser.displayName || 'Anonymous',
        userAvatar: postData.userAvatar || currentUser.photoURL || undefined,
        mediaUrls: mediaUrls,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: Timestamp.now() // Add createdAt field
      });

      return post;
    } catch (error) {
      console.error('Error in PostService.createPost:', error);
      throw error;
    }
  }

  /**
   * Fetch posts with advanced filtering
   * @param options Filtering options
   * @returns Promise resolving to posts and last document for pagination
   */
  async fetchPosts(options?: {
    userId?: string;
    connectionIds?: string[];
    contentTypes?: ContentType[];
    privacyLevel?: PrivacyLevel;
    lastDoc?: any;
    pageSize?: number;
  }): Promise<{ posts: SocialPost[]; lastDoc: any }> {
    try {
      return await this.postRepository.fetchPosts(options);
    } catch (error) {
      console.error('Error in PostService.fetchPosts:', error);
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
    options?: {
      userId?: string;
      limit?: number;
    }
  ): () => void {
    try {
      return this.postRepository.setupPostsListener(callback, options);
    } catch (error) {
      console.error('Error in PostService.setupPostsListener:', error);
      // Return a no-op function as unsubscribe
      return () => {};
    }
  }

  /**
   * Like or unlike a post
   * @param postId Post ID
   * @returns Promise resolving when the operation is complete
   */
  async likePost(postId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.postRepository.likePost(postId, currentUser.uid);
    } catch (error) {
      console.error('Error in PostService.likePost:', error);
      throw error;
    }
  }

  /**
   * Share a post
   * @param postId Post ID
   * @param content Optional comment on the share
   * @returns Promise resolving to the ID of the new shared post
   */
  async sharePost(postId: string, content?: string): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      return await this.postRepository.sharePost(postId, currentUser.uid, content);
    } catch (error) {
      console.error('Error in PostService.sharePost:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   * @param postId Post ID
   * @returns Promise resolving when the post is deleted
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.postRepository.delete(postId);
    } catch (error) {
      console.error('Error in PostService.deletePost:', error);
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
      return await this.postRepository.generateShareableLink(postId);
    } catch (error) {
      console.error('Error in PostService.generateShareableLink:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const postService = new PostService();