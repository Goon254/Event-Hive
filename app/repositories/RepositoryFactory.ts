// app/repositories/RepositoryFactory.ts
import { IPostRepository } from './interfaces/IPostRepository';
import { ICommentRepository } from './interfaces/ICommentRepository';
import { IConnectionRepository } from './interfaces/IConnectionRepository';
import { INotificationRepository } from './interfaces/INotificationRepository';

import { FirebasePostRepository } from './implementations/FirebasePostRepository';
import { FirebaseCommentRepository } from './implementations/FirebaseCommentRepository';
import { FirebaseConnectionRepository } from './implementations/FirebaseConnectionRepository';
import { FirebaseNotificationRepository } from './implementations/FirebaseNotificationRepository';

/**
 * Repository Factory to get repository instances
 * This allows for easy swapping of implementations (e.g., for testing or switching backends)
 */
export class RepositoryFactory {
  private static postRepository: IPostRepository | null = null;
  private static commentRepository: ICommentRepository | null = null;
  private static connectionRepository: IConnectionRepository | null = null;
  private static notificationRepository: INotificationRepository | null = null;

  /**
   * Get the post repository instance
   * @returns Post repository instance
   */
  static getPostRepository(): IPostRepository {
    if (!this.postRepository) {
      this.postRepository = new FirebasePostRepository();
    }
    return this.postRepository;
  }

  /**
   * Get the comment repository instance
   * @returns Comment repository instance
   */
  static getCommentRepository(): ICommentRepository {
    if (!this.commentRepository) {
      this.commentRepository = new FirebaseCommentRepository();
    }
    return this.commentRepository;
  }

  /**
   * Get the connection repository instance
   * @returns Connection repository instance
   */
  static getConnectionRepository(): IConnectionRepository {
    if (!this.connectionRepository) {
      this.connectionRepository = new FirebaseConnectionRepository();
    }
    return this.connectionRepository;
  }

  /**
   * Get the notification repository instance
   * @returns Notification repository instance
   */
  static getNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      this.notificationRepository = new FirebaseNotificationRepository();
    }
    return this.notificationRepository;
  }

  /**
   * Reset all repository instances (useful for testing)
   */
  static reset(): void {
    this.postRepository = null;
    this.commentRepository = null;
    this.connectionRepository = null;
    this.notificationRepository = null;
  }
}

// Add default export
export default RepositoryFactory;