// app/services/social/CommentService.ts
import { auth } from '../../../lib/firebaseConfig';
import { RepositoryFactory } from '../../repositories/RepositoryFactory';
import { Comment } from '../../models/social';

/**
 * Service for comment-related operations
 */
export class CommentService {
  private commentRepository = RepositoryFactory.getCommentRepository();

  /**
   * Get comments for a post
   * @param postId Post ID
   * @returns Promise resolving to an array of comments
   */
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      return await this.commentRepository.getPostComments(postId);
    } catch (error) {
      console.error('Error in CommentService.getPostComments:', error);
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
      return this.commentRepository.setupCommentsListener(postId, callback);
    } catch (error) {
      console.error('Error in CommentService.setupCommentsListener:', error);
      // Return a no-op function as unsubscribe
      return () => {};
    }
  }

  /**
   * Add a comment to a post
   * @param postId Post ID
   * @param content Comment content
   * @param parentCommentId Parent comment ID for replies (optional)
   * @returns Promise resolving to the created comment
   */
  async commentOnPost(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      return await this.commentRepository.commentOnPost(
        postId,
        content,
        currentUser.uid,
        currentUser.displayName || 'Anonymous',
        currentUser.photoURL || undefined,
        parentCommentId
      );
    } catch (error) {
      console.error('Error in CommentService.commentOnPost:', error);
      throw error;
    }
  }

  /**
   * Like a comment
   * @param postId Post ID
   * @param commentId Comment ID
   * @returns Promise resolving when the operation is complete
   */
  async likeComment(postId: string, commentId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.commentRepository.likeComment(postId, commentId, currentUser.uid);
    } catch (error) {
      console.error('Error in CommentService.likeComment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param postId Post ID
   * @param commentId Comment ID
   * @returns Promise resolving when the comment is deleted
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      // In a real implementation, we would check if the user is the owner of the comment
      // or has admin privileges before deleting
      await this.commentRepository.delete(commentId);
    } catch (error) {
      console.error('Error in CommentService.deleteComment:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const commentService = new CommentService();