// app/repositories/interfaces/ICommentRepository.ts
import { IRepository } from './IRepository';
import { Comment } from '../../models/social';

/**
 * Interface for comment repository operations
 */
export interface ICommentRepository extends IRepository<Comment> {
  /**
   * Get comments for a specific post
   * @param postId Post ID
   * @returns Promise resolving to an array of comments
   */
  getPostComments(postId: string): Promise<Comment[]>;

  /**
   * Set up a real-time listener for comments on a post
   * @param postId Post ID
   * @param callback Function to call when comments change
   * @returns Unsubscribe function to stop listening
   */
  setupCommentsListener(
    postId: string,
    callback: (comments: Comment[]) => void
  ): () => void;

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
  commentOnPost(
    postId: string,
    content: string,
    userId: string,
    userName: string,
    userAvatar?: string,
    parentCommentId?: string
  ): Promise<Comment>;

  /**
   * Like a comment
   * @param postId Post ID
   * @param commentId Comment ID
   * @param userId User ID
   * @returns Promise resolving when the operation is complete
   */
  likeComment(postId: string, commentId: string, userId: string): Promise<void>;
}

// Add default export
export default ICommentRepository;