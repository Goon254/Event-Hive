// app/repositories/interfaces/INotificationRepository.ts
import { IRepository } from './IRepository';
import { SocialNotification } from '../../models/social';

/**
 * Interface for notification repository operations
 */
export interface INotificationRepository extends IRepository<SocialNotification> {
  /**
   * Get notifications for a user
   * @param userId User ID
   * @param limit Maximum number of notifications to retrieve
   * @returns Promise resolving to an array of notifications
   */
  getNotifications(userId: string, limit?: number): Promise<SocialNotification[]>;

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Promise resolving when the notification is marked as read
   */
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Promise resolving when all notifications are marked as read
   */
  markAllNotificationsAsRead(userId: string): Promise<void>;

  /**
   * Delete a notification
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Promise resolving when the notification is deleted
   */
  deleteNotification(notificationId: string, userId: string): Promise<void>;

  /**
   * Create a notification
   * @param notification Notification data
   * @returns Promise resolving to the created notification
   */
  createNotification(notification: Omit<SocialNotification, 'id' | 'createdAt'>): Promise<SocialNotification>;

  /**
   * Set up a real-time listener for notifications
   * @param userId User ID
   * @param callback Function to call when notifications change
   * @param limit Maximum number of notifications to retrieve
   * @returns Unsubscribe function to stop listening
   */
  setupNotificationsListener(
    userId: string,
    callback: (notifications: SocialNotification[]) => void,
    limit?: number
  ): () => void;
}

// Add default export
export default INotificationRepository;