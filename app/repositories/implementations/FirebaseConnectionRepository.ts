// app/repositories/implementations/FirebaseConnectionRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../../lib/firebaseConfig';
import { FirebaseRepository } from './FirebaseRepository';
import { IConnectionRepository } from '../interfaces/IConnectionRepository';
import { Connection, ConnectionStatus } from '../../models/social';
import { sanitizeForFirestore } from '../../services/migrationService';

/**
 * Firebase implementation of the Connection Repository
 */
export class FirebaseConnectionRepository extends FirebaseRepository<Connection> implements IConnectionRepository {
  constructor() {
    super('connections');
  }

  /**
   * Send a connection request to another user
   * @param userId Current user ID
   * @param connectionId Target user ID
   * @returns Promise resolving when the request is sent
   */
  async sendConnectionRequest(userId: string, connectionId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Create a unique connection ID (smaller ID first for consistency)
      const uniqueConnectionId = userId < connectionId 
        ? `${userId}_${connectionId}` 
        : `${connectionId}_${userId}`;
      
      // Check if connection already exists
      const connectionRef = doc(db, 'connections', uniqueConnectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (connectionDoc.exists()) {
        const connectionData = connectionDoc.data();
        
        // If already connected or pending, don't create a new request
        if (connectionData.status === ConnectionStatus.ACCEPTED) {
          throw new Error('Already connected with this user');
        }
        
        if (connectionData.status === ConnectionStatus.PENDING) {
          throw new Error('Connection request already pending');
        }
        
        if (connectionData.status === ConnectionStatus.BLOCKED) {
          throw new Error('Unable to connect with this user');
        }
      }
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Create connection request data
      const connectionData = {
        userId: userId,
        connectionId: connectionId,
        status: ConnectionStatus.PENDING,
        connectionRequest: {
          sentBy: userId,
          sentAt: serverTimestamp()
        }
      };
      
      // Sanitize connection data
      const sanitizedConnectionData = sanitizeForFirestore(connectionData);
      
      // Save to Firestore
      await setDoc(connectionRef, sanitizedConnectionData);
      
      // Create notification data for the recipient
      const notificationData = {
        userId: connectionId,
        type: 'connection_request',
        relatedUserId: userId,
        relatedUserName: userData?.displayName || 'Anonymous',
        relatedUserAvatar: userData?.photoURL || null,
        read: false,
        createdAt: serverTimestamp()
      };
      
      // Sanitize notification data
      const sanitizedNotificationData = sanitizeForFirestore(notificationData);
      
      // Save notification to Firestore
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, sanitizedNotificationData);
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  /**
   * Accept a connection request
   * @param userId Current user ID
   * @param connectionId User ID who sent the request
   * @returns Promise resolving when the request is accepted
   */
  async acceptConnectionRequest(userId: string, connectionId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Get the connection ID
      const uniqueConnectionId = userId < connectionId 
        ? `${userId}_${connectionId}` 
        : `${connectionId}_${userId}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', uniqueConnectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }
      
      const connectionData = connectionDoc.data();
      
      // Verify it's a pending request sent to the current user
      if (connectionData.status !== ConnectionStatus.PENDING) {
        throw new Error('No pending connection request');
      }
      
      if (connectionData.connectionRequest?.sentBy === userId) {
        throw new Error('Cannot accept your own connection request');
      }
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Update connection status
      await updateDoc(connectionRef, {
        status: ConnectionStatus.ACCEPTED,
        connectionDate: serverTimestamp(),
        lastInteraction: serverTimestamp()
      });
      
      // Create notification data for the sender
      const notificationData = {
        userId: connectionId,
        type: 'connection_accepted',
        relatedUserId: userId,
        relatedUserName: userData?.displayName || 'Anonymous',
        relatedUserAvatar: userData?.photoURL || null,
        read: false,
        createdAt: serverTimestamp()
      };
      
      // Sanitize notification data
      const sanitizedNotificationData = sanitizeForFirestore(notificationData);
      
      // Save notification to Firestore
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, sanitizedNotificationData);
      
      // Update follower/following counts for both users
      const batch = writeBatch(db);
      
      // Update current user's following count
      const currentUserRef = doc(db, 'users', userId);
      batch.update(currentUserRef, {
        following: increment(1)
      });
      
      // Update other user's followers count
      const otherUserRef = doc(db, 'users', connectionId);
      batch.update(otherUserRef, {
        followers: increment(1)
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  }

  /**
   * Decline a connection request
   * @param userId Current user ID
   * @param connectionId User ID who sent the request
   * @returns Promise resolving when the request is declined
   */
  async declineConnectionRequest(userId: string, connectionId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Get the connection ID
      const uniqueConnectionId = userId < connectionId 
        ? `${userId}_${connectionId}` 
        : `${connectionId}_${userId}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', uniqueConnectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }
      
      const connectionData = connectionDoc.data();
      
      // Verify it's a pending request sent to the current user
      if (connectionData.status !== ConnectionStatus.PENDING) {
        throw new Error('No pending connection request');
      }
      
      if (connectionData.connectionRequest?.sentBy === userId) {
        throw new Error('Cannot decline your own connection request');
      }
      
      // Update connection status
      await updateDoc(connectionRef, {
        status: ConnectionStatus.DECLINED,
        lastInteraction: serverTimestamp()
      });
    } catch (error) {
      console.error('Error declining connection request:', error);
      throw error;
    }
  }

  /**
   * Remove an existing connection
   * @param userId Current user ID
   * @param connectionId Connected user ID
   * @returns Promise resolving when the connection is removed
   */
  async removeConnection(userId: string, connectionId: string): Promise<void> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Get the connection ID
      const uniqueConnectionId = userId < connectionId 
        ? `${userId}_${connectionId}` 
        : `${connectionId}_${userId}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', uniqueConnectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection not found');
      }
      
      const connectionData = connectionDoc.data();
      
      // Verify it's an accepted connection
      if (connectionData.status !== ConnectionStatus.ACCEPTED) {
        throw new Error('Not connected with this user');
      }
      
      // Delete the connection
      await deleteDoc(connectionRef);
      
      // Update follower/following counts for both users
      const batch = writeBatch(db);
      
      // Update current user's following count
      const currentUserRef = doc(db, 'users', userId);
      batch.update(currentUserRef, {
        following: increment(-1)
      });
      
      // Update other user's followers count
      const otherUserRef = doc(db, 'users', connectionId);
      batch.update(otherUserRef, {
        followers: increment(-1)
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  /**
   * Get all connections for a user
   * @param userId User ID
   * @returns Promise resolving to an array of connections
   */
  async getUserConnections(userId: string): Promise<Connection[]> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Query connections where the user is either the initiator or the recipient
      const connectionsQuery = query(
        this.collectionRef,
        where('status', '==', ConnectionStatus.ACCEPTED),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(connectionsQuery);
      const connections: Connection[] = [];
      
      querySnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data()
        } as Connection);
      });
      
      // Also get connections where the user is the recipient
      const recipientConnectionsQuery = query(
        this.collectionRef,
        where('status', '==', ConnectionStatus.ACCEPTED),
        where('connectionId', '==', userId)
      );
      
      const recipientSnapshot = await getDocs(recipientConnectionsQuery);
      
      recipientSnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data()
        } as Connection);
      });
      
      return connections;
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw error;
    }
  }

  /**
   * Get pending connection requests for a user
   * @param userId User ID
   * @returns Promise resolving to an array of pending connection requests
   */
  async getPendingConnectionRequests(userId: string): Promise<Connection[]> {
    try {
      if (!userId) throw new Error('User ID is required');
      
      // Query connections where the current user is the recipient of a pending request
      const connectionsQuery = query(
        this.collectionRef,
        where('status', '==', ConnectionStatus.PENDING),
        where('connectionId', '==', userId)
      );
      
      const querySnapshot = await getDocs(connectionsQuery);
      const connections: Connection[] = [];
      
      querySnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data()
        } as Connection);
      });
      
      return connections;
    } catch (error) {
      console.error('Error getting pending connection requests:', error);
      throw error;
    }
  }

  /**
   * Check if a connection exists between two users
   * @param userId First user ID
   * @param connectionId Second user ID
   * @returns Promise resolving to the connection status or null if no connection exists
   */
  async getConnectionStatus(userId: string, connectionId: string): Promise<ConnectionStatus | null> {
    try {
      if (!userId || !connectionId) throw new Error('Both user IDs are required');
      
      // Get the connection ID
      const uniqueConnectionId = userId < connectionId 
        ? `${userId}_${connectionId}` 
        : `${connectionId}_${userId}`;
      
      // Get the connection document
      const connectionRef = doc(db, 'connections', uniqueConnectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        return null;
      }
      
      return connectionDoc.data().status as ConnectionStatus;
    } catch (error) {
      console.error('Error getting connection status:', error);
      throw error;
    }
  }
}