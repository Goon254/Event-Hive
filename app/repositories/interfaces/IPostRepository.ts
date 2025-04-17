// app/repositories/interfaces/IPostRepository.ts
import { IRepository } from './IRepository';
import { SocialPost, ContentType, PrivacyLevel } from '../../models/social';

/**
 * Interface for post repository operations
 */
export interface IPostRepository extends IRepository<SocialPost> {
  /**
   * Fetch posts with advanced filtering
   * @param options Filtering options
   * @returns Promise resolving to posts and last document for pagination
   */
  fetchPosts(options?: {
    userId?: string;
    connectionIds?: string[];
    contentTypes?: ContentType[];
    privacyLevel?: PrivacyLevel;
    lastDoc?: any;
    pageSize?: number;
  }): Promise<{ posts: SocialPost[]; lastDoc: any }>;

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
  ): () => void;

  /**
   * Like or unlike a post
   * @param postId Post ID
   * @param userId User ID
   * @returns Promise resolving when the operation is complete
   */
  likePost(postId: string, userId: string): Promise<void>;

  /**
   * Share a post
   * @param postId Post ID to share
   * @param userId User ID sharing the post
   * @param content Optional comment on the share
   * @returns Promise resolving to the ID of the new shared post
   */
  sharePost(postId: string, userId: string, content?: string): Promise<string>;

  /**
   * Generate a shareable link for a post
   * @param postId Post ID
   * @returns Promise resolving to the shareable link
   */
  generateShareableLink(postId: string): Promise<string>;
}

// Add default export
export default IPostRepository;