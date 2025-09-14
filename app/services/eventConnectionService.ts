// app/services/eventConnectionService.ts
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  serverTimestamp, 
  Timestamp,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { 
  Connection, 
  ConnectionStatus, 
  EnhancedConnection
} from '../models/connection/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventService from './eventServices';

// Constants
const CONNECTIONS_CACHE_KEY = 'user_connections_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Service for handling event-based connections
 * This streamlined version only allows connections between users who attended the same event
 */
export class EventConnectionService {
  /**
   * Check if two users can connect (attended the same event)
   * @param userId Current user ID
   * @param connectionId Potential connection user ID
   * @returns Promise resolving to boolean indicating if connection is allowed
   */
  async canUsersConnect(userId: string, connectionId: string): Promise<boolean> {
    try {
      // Get events attended by current user
      const userEventsResponse = await eventService.getUserAttendingEvents(userId);
      const userEvents = userEventsResponse.items;
      
      // For each event, check if the other user also attended
      for (const event of userEvents) {
        const attendees = await eventService.getEventAttendees(event.id);
        
        if (attendees.includes(connectionId)) {
          return true; // Both users attended this event
        }
      }
      
      return false; // No common events found
    } catch (error) {
      console.error('Error checking if users can connect:', error);
      return false;
    }
  }
  
  /**
   * Check if a user is an event organizer
   * @param userId User ID to check
   * @returns Promise resolving to boolean indicating if user is an organizer
   */
  async isUserEventOrganizer(userId: string): Promise<boolean> {
    try {
      // Get events created by the user
      const userCreatedEventsResponse = await eventService.getUserEvents(userId);
      
      // If the user has created at least one event, consider them an organizer
      return userCreatedEventsResponse.items.length > 0;
    } catch (error) {
      console.error('Error checking if user is an event organizer:', error);
      return false;
    }
  }
  
  /**
   * Send connection request
   * Only allows connection if users attended the same event
   * @param userId User ID
   * @param connectionId Connection ID
   * @returns Promise resolving to connection ID or null if not allowed
   */
  async sendConnectionRequest(userId: string, connectionId: string): Promise<string | null> {
    try {
      // Check if users can connect (attended the same event)
      const canConnect = await this.canUsersConnect(userId, connectionId);
      
      if (!canConnect) {
        console.log('Connection not allowed: Users did not attend the same event');
        return null;
      }
      
      // Create connection in Firestore
      const connectionRef = doc(collection(db, 'connections'));
      
      await setDoc(connectionRef, {
        id: connectionRef.id,
        userId,
        connectionId,
        status: ConnectionStatus.PENDING,
        connectionRequest: {
          sentBy: userId,
          sentAt: serverTimestamp(),
        },
      });
      
      return connectionRef.id;
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }
  
  /**
   * Follow an event organizer
   * @param userId User ID
   * @param organizerId Organizer ID
   * @returns Promise resolving to connection ID or null if not an organizer
   */
  async followOrganizer(userId: string, organizerId: string): Promise<string | null> {
    try {
      // Check if the target user is an organizer
      const isOrganizer = await this.isUserEventOrganizer(organizerId);
      
      if (!isOrganizer) {
        console.log('Follow not allowed: Target user is not an event organizer');
        return null;
      }
      
      // Create connection in Firestore (auto-accepted for organizers)
      const connectionRef = doc(collection(db, 'connections'));
      
      await setDoc(connectionRef, {
        id: connectionRef.id,
        userId,
        connectionId: organizerId,
        status: ConnectionStatus.ACCEPTED, // Auto-accept for organizers
        connectionDate: serverTimestamp(),
        connectionRequest: {
          sentBy: userId,
          sentAt: serverTimestamp(),
        },
      });
      
      return connectionRef.id;
    } catch (error) {
      console.error('Error following organizer:', error);
      throw error;
    }
  }
  
  /**
   * Accept connection request
   * @param userId User ID
   * @param connectionId Connection ID
   */
  async acceptConnectionRequest(userId: string, connectionId: string): Promise<void> {
    try {
      // Find the connection request
      const connectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('userId', '==', connectionId),
          where('connectionId', '==', userId),
          where('status', '==', ConnectionStatus.PENDING)
        )
      );
      
      if (connectionsSnapshot.empty) {
        throw new Error('Connection request not found');
      }
      
      // Update connection status
      const connectionDoc = connectionsSnapshot.docs[0];
      await updateDoc(doc(db, 'connections', connectionDoc.id), {
        status: ConnectionStatus.ACCEPTED,
        connectionDate: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  }
  
  /**
   * Decline connection request
   * @param userId User ID
   * @param connectionId Connection ID
   */
  async declineConnectionRequest(userId: string, connectionId: string): Promise<void> {
    try {
      // Find the connection request
      const connectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('userId', '==', connectionId),
          where('connectionId', '==', userId),
          where('status', '==', ConnectionStatus.PENDING)
        )
      );
      
      if (connectionsSnapshot.empty) {
        throw new Error('Connection request not found');
      }
      
      // Update connection status
      const connectionDoc = connectionsSnapshot.docs[0];
      await updateDoc(doc(db, 'connections', connectionDoc.id), {
        status: ConnectionStatus.REJECTED,
      });
    } catch (error) {
      console.error('Error declining connection request:', error);
      throw error;
    }
  }
  
  /**
   * Remove connection
   * @param userId User ID
   * @param connectionId Connection ID
   */
  async removeConnection(userId: string, connectionId: string): Promise<void> {
    try {
      // Find the connection
      const connectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('userId', 'in', [userId, connectionId]),
          where('connectionId', 'in', [userId, connectionId]),
          where('status', '==', ConnectionStatus.ACCEPTED)
        )
      );
      
      if (connectionsSnapshot.empty) {
        throw new Error('Connection not found');
      }
      
      // Update connection status
      const batch = writeBatch(db);
      connectionsSnapshot.forEach(doc => {
        batch.update(doc.ref, { status: ConnectionStatus.REJECTED });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }
  
  /**
   * Get user connections
   * @param userId User ID
   * @returns Promise resolving to connections
   */
  async getUserConnections(userId: string): Promise<EnhancedConnection[]> {
    try {
      // Try to load from cache first
      const cachedData = await this.loadConnectionsFromCache(userId);
      
      if (cachedData && Date.now() < cachedData.expiresAt) {
        console.log('Using cached connections');
        return cachedData.connections;
      }
      
      // Fetch accepted connections where user is either the sender or receiver
      const connectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('status', '==', ConnectionStatus.ACCEPTED),
          where('userId', '==', userId)
        )
      );
      
      const connections: EnhancedConnection[] = [];
      
      for (const docSnap of connectionsSnapshot.docs) {
        const connection = docSnap.data() as Connection;
        
        // Fetch user profile for the connection
        const profileId = connection.connectionId;
        const userRef = doc(db as any, 'users', profileId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData: any = userDoc.data();
          
          connections.push({
            ...connection,
            id: docSnap.id,
            name: userData.name || userData.displayName || 'Unknown',
            avatar: userData.profileImageUrl || userData.photoURL,
            role: userData.userType || userData.role,
          } as EnhancedConnection);
        }
      }
      
      // Also check connections where user is the receiver
      const reverseConnectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('status', '==', ConnectionStatus.ACCEPTED),
          where('connectionId', '==', userId)
        )
      );
      
      for (const docSnap of reverseConnectionsSnapshot.docs) {
        const connection = docSnap.data() as Connection;
        
        // Fetch user profile for the connection
        const profileId = connection.userId;
        const userRef = doc(db as any, 'users', profileId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData: any = userDoc.data();
          
          connections.push({
            ...connection,
            id: docSnap.id,
            name: userData.name || userData.displayName || 'Unknown',
            avatar: userData.profileImageUrl || userData.photoURL,
            role: userData.userType || userData.role,
          } as EnhancedConnection);
        }
      }
      
      // Cache the connections
      await this.cacheConnections(userId, connections);
      
      return connections;
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw error;
    }
  }
  
  /**
   * Get pending connection requests
   * @param userId User ID
   * @returns Promise resolving to pending connections
   */
  async getPendingConnectionRequests(userId: string): Promise<EnhancedConnection[]> {
    try {
      // Fetch pending connections where user is the receiver
      const connectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('connectionId', '==', userId),
          where('status', '==', ConnectionStatus.PENDING)
        )
      );
      
      const connections: EnhancedConnection[] = [];
      
      for (const docSnap of connectionsSnapshot.docs) {
        const connection = docSnap.data() as Connection;
        
        // Fetch user profile for the connection
        const profileId = connection.userId;
        const userRef = doc(db as any, 'users', profileId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData: any = userDoc.data();
          
          connections.push({
            ...connection,
            id: docSnap.id,
            name: userData.name || userData.displayName || 'Unknown',
            avatar: userData.profileImageUrl || userData.photoURL,
            role: userData.userType || userData.role,
          } as EnhancedConnection);
        }
      }
      
      return connections;
    } catch (error) {
      console.error('Error getting pending connection requests:', error);
      throw error;
    }
  }
  
  /**
   * Get potential connections (users who attended the same events)
   * @param userId User ID
   * @returns Promise resolving to potential connections
   */
  async getPotentialConnections(userId: string): Promise<EnhancedConnection[]> {
    try {
      // Get events attended by current user
      const userEventsResponse = await eventService.getUserAttendingEvents(userId);
      const userEvents = userEventsResponse.items;
      
      // Set to track unique potential connections
      const potentialConnectionIds = new Set<string>();
      
      // For each event, get attendees
      for (const event of userEvents) {
        const attendees = await eventService.getEventAttendees(event.id);
        
        // Add attendees to potential connections (excluding current user)
        attendees.forEach(attendeeId => {
          if (attendeeId !== userId) {
            potentialConnectionIds.add(attendeeId);
          }
        });
      }
      
      // Get existing connections to exclude
      const existingConnections = await this.getUserConnections(userId);
      const existingConnectionIds = new Set(
        existingConnections.map(conn => 
          conn.userId === userId ? conn.connectionId : conn.userId
        )
      );
      
      // Get pending connections to exclude
      const pendingConnections = await this.getPendingConnectionRequests(userId);
      const pendingConnectionIds = new Set(
        pendingConnections.map(conn => conn.userId)
      );
      
      // Filter out existing and pending connections
      const filteredConnectionIds = Array.from(potentialConnectionIds).filter(id => 
        !existingConnectionIds.has(id) && !pendingConnectionIds.has(id)
      );
      
      // Fetch user profiles for potential connections
      const connections: EnhancedConnection[] = [];
      
      for (const connectionId of filteredConnectionIds) {
        const userDoc = await getDoc(doc(db, 'users', connectionId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          connections.push({
            id: connectionId,
            userId,
            connectionId,
            status: ConnectionStatus.PENDING, // Not actually pending, just for UI
            name: userData.name || userData.displayName || 'Unknown',
            avatar: userData.profileImageUrl || userData.photoURL,
            role: userData.userType || userData.role,
          } as EnhancedConnection);
        }
      }
      
      return connections;
    } catch (error) {
      console.error('Error getting potential connections:', error);
      throw error;
    }
  }
  
  /**
   * Cache connections
   * @param userId User ID
   * @param connections Connections to cache
   */
  private async cacheConnections(userId: string, connections: EnhancedConnection[]): Promise<void> {
    try {
      const cacheData = {
        connections,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY,
      };
      
      await AsyncStorage.setItem(
        `${CONNECTIONS_CACHE_KEY}_${userId}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error caching connections:', error);
    }
  }
  
  /**
   * Load connections from cache
   * @param userId User ID
   * @returns Promise resolving to cached connections or null
   */
  private async loadConnectionsFromCache(userId: string): Promise<{connections: EnhancedConnection[], timestamp: number, expiresAt: number} | null> {
    try {
      const cacheJson = await AsyncStorage.getItem(`${CONNECTIONS_CACHE_KEY}_${userId}`);
      
      if (cacheJson) {
        return JSON.parse(cacheJson);
      }
      
      return null;
    } catch (error) {
      console.error('Error loading connections from cache:', error);
      return null;
    }
  }
}

// Create singleton instance
export const eventConnectionService = new EventConnectionService();

// Add default export
export default eventConnectionService;