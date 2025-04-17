// app/services/social/NotificationService.ts
import { auth } from '../../../lib/firebaseConfig';
import { RepositoryFactory } from '../../repositories/RepositoryFactory';
import { SocialNotification } from '../../models/social';
import { Timestamp } from 'firebase/firestore';

/**
 * Service for notification-related operations
 */
export class NotificationService {
  private notificationRepository = RepositoryFactory.getNotificationRepository();

  /**
   * Get notifications for the current user
   * @param limit Maximum number of notifications to retrieve
   * @returns Promise resolving to an array of notifications
   */
  async getNotifications(limit?: number): Promise<SocialNotification[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      return await this.notificationRepository.getNotifications(currentUser.uid, limit);
    } catch (error) {
      console.error('Error in NotificationService.getNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @returns Promise resolving when the notification is marked as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.notificationRepository.markNotificationAsRead(notificationId, currentUser.uid);
    } catch (error) {
      console.error('Error in NotificationService.markNotificationAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for the current user
   * @returns Promise resolving when all notifications are marked as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.notificationRepository.markAllNotificationsAsRead(currentUser.uid);
    } catch (error) {
      console.error('Error in NotificationService.markAllNotificationsAsRead:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param notificationId Notification ID
   * @returns Promise resolving when the notification is deleted
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.notificationRepository.deleteNotification(notificationId, currentUser.uid);
    } catch (error) {
      console.error('Error in NotificationService.deleteNotification:', error);
      throw error;
    }
  }

  /**
   * Create a notification
   * @param notification Notification data
   * @returns Promise resolving to the created notification
   */
  async createNotification(notification: Omit<SocialNotification, 'id' | 'createdAt'>): Promise<SocialNotification> {
    try {
      return await this.notificationRepository.createNotification(notification);
    } catch (error) {
      console.error('Error in NotificationService.createNotification:', error);
      throw error;
    }
  }

  /**
   * Set up a real-time listener for notifications
   * @param callback Function to call when notifications change
   * @param limit Maximum number of notifications to retrieve
   * @returns Unsubscribe function to stop listening
   */
  setupNotificationsListener(
    callback: (notifications: SocialNotification[]) => void,
    limit?: number
  ): () => void {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated for notifications listener');
        callback([]);
        return () => {};
      }

      return this.notificationRepository.setupNotificationsListener(currentUser.uid, callback, limit);
    } catch (error) {
      console.error('Error in NotificationService.setupNotificationsListener:', error);
      // Return a no-op function as unsubscribe
      return () => {};
    }
  }

  /**
   * Create a like notification
   * @param postId Post ID
   * @param targetUserId User ID to notify
   * @returns Promise resolving to the created notification
   */
  async createLikeNotification(postId: string, targetUserId: string): Promise<SocialNotification> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Don't create notifications for self-likes
      if (currentUser.uid === targetUserId) {
        throw new Error('Cannot create notification for self-like');
      }

      const notification = {
        userId: targetUserId,
        type: 'like' as const,
        relatedUserId: currentUser.uid,
        relatedUserName: currentUser.displayName || 'Anonymous',
        relatedUserAvatar: currentUser.photoURL || undefined,
        relatedPostId: postId,
        read: false,
        createdAt: Timestamp.now()
      };

      return await this.notificationRepository.createNotification(notification);
    } catch (error) {
      console.error('Error in NotificationService.createLikeNotification:', error);
      throw error;
    }
  }

  /**
   * Create a comment notification
   * @param postId Post ID
   * @param targetUserId User ID to notify
   * @returns Promise resolving to the created notification
   */
  async createCommentNotification(postId: string, targetUserId: string): Promise<SocialNotification> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Don't create notifications for self-comments
      if (currentUser.uid === targetUserId) {
        throw new Error('Cannot create notification for self-comment');
      }

      const notification = {
        userId: targetUserId,
        type: 'comment' as const,
        relatedUserId: currentUser.uid,
        relatedUserName: currentUser.displayName || 'Anonymous',
        relatedUserAvatar: currentUser.photoURL || undefined,
        relatedPostId: postId,
        read: false,
        createdAt: Timestamp.now()
      };

      return await this.notificationRepository.createNotification(notification);
    } catch (error) {
      console.error('Error in NotificationService.createCommentNotification:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();