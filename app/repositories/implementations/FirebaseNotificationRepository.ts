// app/repositories/implementations/FirebaseNotificationRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../../lib/firebaseConfig';
import { FirebaseRepository } from './FirebaseRepository';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { SocialNotification } from '../../models/social';
import { sanitizeForFirestore } from '../../services/migrationService';

/**
 * Firebase implementation of the Notification Repository
 */
export class FirebaseNotificationRepository extends FirebaseRepository<SocialNotification> implements INotificationRepository {
  constructor() {
    super('notifications');
  }

  /**
   * Get notifications for a user
   * @param userId User ID
   * @param limit Maximum number of notifications to retrieve
   * @returns Promise resolving to an array of notifications
   */
  async getNotifications(userId: string, limitCount: number = 50): Promise<SocialNotification[]> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const notificationsQuery = query(
        this.collectionRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
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

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Promise resolving when the notification is marked as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notificationData = notificationDoc.data();
      
      // Verify ownership
      if (notificationData.userId !== userId) {
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

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Promise resolving when all notifications are marked as read
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const notificationsQuery = query(
        this.collectionRef,
        where('userId', '==', userId),
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

  /**
   * Delete a notification
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Promise resolving when the notification is deleted
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notificationData = notificationDoc.data();
      
      // Verify ownership
      if (notificationData.userId !== userId) {
        throw new Error('Not authorized to delete this notification');
      }
      
      // Delete notification
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
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
      // Sanitize notification data
      const sanitizedNotificationData = sanitizeForFirestore({
        ...notification,
        createdAt: serverTimestamp(),
        read: notification.read || false
      });
      
      // Create notification
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, sanitizedNotificationData);
      
      // Return the created notification with the generated ID
      return {
        id: notificationRef.id,
        ...notification,
        createdAt: Timestamp.now()
      } as SocialNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

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
    limitCount: number = 50
  ): () => void {
    try {
      if (!userId) {
        console.warn('User ID is required for notifications listener');
        callback([]);
        return () => {};
      }
      
      const notificationsQuery = query(
        this.collectionRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notifications: SocialNotification[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || Timestamp.now()
          } as SocialNotification);
        });
        
        callback(notifications);
      }, (error) => {
        console.error('Error in notifications listener:', error);
      });
      
      // Return unsubscribe function to clean up listener
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      console.warn('Returning empty unsubscribe function');
      return () => {};
    }
  }
}

// Add default export
export default FirebaseNotificationRepository;