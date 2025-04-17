// app/services/social/SocialService.ts
import { postService, PostService } from './PostService';
import { commentService, CommentService } from './CommentService';
import { connectionService, ConnectionService } from './ConnectionService';
import { notificationService, NotificationService } from './NotificationService';

/**
 * Main Social Service that serves as a facade for all social-related services
 * This provides a single entry point for social functionality while maintaining
 * separation of concerns in the implementation
 */
export class SocialService {
  /**
   * Post-related operations
   */
  readonly posts: PostService;

  /**
   * Comment-related operations
   */
  readonly comments: CommentService;

  /**
   * Connection-related operations
   */
  readonly connections: ConnectionService;

  /**
   * Notification-related operations
   */
  readonly notifications: NotificationService;

  /**
   * Constructor
   * @param postService Post service instance
   * @param commentService Comment service instance
   * @param connectionService Connection service instance
   * @param notificationService Notification service instance
   */
  constructor(
    postService: PostService,
    commentService: CommentService,
    connectionService: ConnectionService,
    notificationService: NotificationService
  ) {
    this.posts = postService;
    this.comments = commentService;
    this.connections = connectionService;
    this.notifications = notificationService;
  }
}

/**
 * Singleton instance of the Social Service
 * Usage examples:
 * 
 * // Create a post
 * const post = await socialService.posts.createPost({...});
 * 
 * // Get comments for a post
 * const comments = await socialService.comments.getPostComments(postId);
 * 
 * // Send a connection request
 * await socialService.connections.sendConnectionRequest(userId);
 * 
 * // Get notifications
 * const notifications = await socialService.notifications.getNotifications();
 */
export const socialService = new SocialService(
  postService,
  commentService,
  connectionService,
  notificationService
);

// Export default for backward compatibility
export default socialService;