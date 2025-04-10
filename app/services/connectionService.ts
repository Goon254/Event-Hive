// app/services/connectionService.ts
import { useState, useEffect, useCallback } from 'react';
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
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { 
  Connection, 
  ConnectionStatus, 
  EnhancedConnection,
  ConnectionShard,
  ConnectionCache
} from '../models/connection/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const API_BASE_URL = 'https://api.scangoapp.com';
const CONNECTIONS_CACHE_KEY = 'user_connections_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const SHARD_SIZE = 100; // Number of connections per shard

/**
 * Service for handling connection operations
 */
export class ConnectionService {
  /**
   * Fetch all connections for a user
   * @param userId User ID
   * @returns Promise resolving to connections
   */
  async fetchConnections(userId: string): Promise<EnhancedConnection[]> {
    try {
      // Try to load from cache first
      const cachedData = await this.loadConnectionsFromCache(userId);
      
      if (cachedData && Date.now() < cachedData.expiresAt) {
        console.log('Using cached connections');
        return cachedData.connections;
      }
      
      // Fetch user's connection shards
      const shardsSnapshot = await getDocs(
        query(collection(db, 'connectionShards'), where('userId', '==', userId))
      );
      
      const shards: ConnectionShard[] = [];
      shardsSnapshot.forEach(doc => {
        shards.push({ ...doc.data(), shardId: doc.id } as ConnectionShard);
      });
      
      // Fetch connections from each shard
      const allConnections: EnhancedConnection[] = [];
      
      for (const shard of shards) {
        // Fetch connections in batches to avoid large queries
        const connectionsSnapshot = await getDocs(
          query(
            collection(db, 'connections'),
            where('id', 'in', shard.connections.slice(0, 10)) // Firestore limits 'in' queries to 10 items
          )
        );
        
        connectionsSnapshot.forEach(doc => {
          const connection = doc.data() as Connection;
          
          // Add to connections array
          allConnections.push({
            ...connection,
            id: doc.id,
            name: '', // Will be populated from user profile
            shardId: shard.shardId,
          } as EnhancedConnection);
        });
      }
      
      // Also fetch direct connections (for backward compatibility)
      const directConnectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('userId', '==', userId)
        )
      );
      
      directConnectionsSnapshot.forEach(doc => {
        const connection = doc.data() as Connection;
        
        // Check if this connection is already in a shard
        const isInShard = allConnections.some(c => c.id === doc.id);
        
        if (!isInShard) {
          // Add to connections array
          allConnections.push({
            ...connection,
            id: doc.id,
            name: '', // Will be populated from user profile
          } as EnhancedConnection);
        }
      });
      
      // Fetch pending connection requests
      const pendingConnectionsSnapshot = await getDocs(
        query(
          collection(db, 'connections'),
          where('connectionId', '==', userId),
          where('status', '==', ConnectionStatus.PENDING)
        )
      );
      
      pendingConnectionsSnapshot.forEach(doc => {
        const connection = doc.data() as Connection;
        
        // Add to connections array
        allConnections.push({
          ...connection,
          id: doc.id,
          name: '', // Will be populated from user profile
        } as EnhancedConnection);
      });
      
      // Cache the connections
      await this.cacheConnections(userId, allConnections);
      
      return allConnections;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }
  
  /**
   * Fetch user profile for a connection
   * @param connection Connection object
   * @param currentUserId Current user ID
   * @returns Promise resolving to enhanced connection
   */
  async fetchConnectionUserProfile(connection: Connection, currentUserId: string): Promise<EnhancedConnection> {
    try {
      // Determine which user ID to fetch (the one that's not the current user)
      const profileId = connection.userId === currentUserId ? connection.connectionId : connection.userId;
      
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', profileId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        return {
          ...connection,
          id: connection.id,
          name: userData.name || userData.displayName || 'Unknown',
          avatar: userData.profileImageUrl || userData.photoURL,
          role: userData.userType || userData.role,
          publicKey: userData.publicKey,
        } as EnhancedConnection;
      }
      
      return {
        ...connection,
        id: connection.id,
        name: 'Unknown User',
      } as EnhancedConnection;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        ...connection,
        id: connection.id,
        name: 'Unknown User',
      } as EnhancedConnection;
    }
  }
  
  /**
   * Cache connections
   * @param userId User ID
   * @param connections Connections to cache
   */
  async cacheConnections(userId: string, connections: EnhancedConnection[]): Promise<void> {
    try {
      const cacheData: ConnectionCache = {
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
  async loadConnectionsFromCache(userId: string): Promise<ConnectionCache | null> {
    try {
      const cacheJson = await AsyncStorage.getItem(`${CONNECTIONS_CACHE_KEY}_${userId}`);
      
      if (cacheJson) {
        return JSON.parse(cacheJson) as ConnectionCache;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading connections from cache:', error);
      return null;
    }
  }
  
  /**
   * Send connection request
   * @param userId User ID
   * @param connectionId Connection ID
   * @returns Promise resolving to connection ID
   */
  async sendConnectionRequest(userId: string, connectionId: string): Promise<string> {
    try {
      // Create connection in Firestore
      const connectionRef = doc(collection(db, 'connections'));
      
      await updateDoc(connectionRef, {
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
      
      // Update connection shards
      await this.updateConnectionShards(userId, connectionId);
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
      
      // Remove from connection shards
      await this.removeFromConnectionShards(userId, connectionId);
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }
  
  /**
   * Update connection shards
   * @param userId User ID
   * @param connectionId Connection ID
   */
  async updateConnectionShards(userId: string, connectionId: string): Promise<void> {
    try {
      // Fetch user's connection shards
      const shardsSnapshot = await getDocs(
        query(collection(db, 'connectionShards'), where('userId', '==', userId))
      );
      
      const shards: ConnectionShard[] = [];
      shardsSnapshot.forEach(doc => {
        shards.push({ ...doc.data(), shardId: doc.id } as ConnectionShard);
      });
      
      // Find a shard with space or create a new one
      let targetShard = shards.find(s => s.connections.length < SHARD_SIZE);
      
      if (!targetShard) {
        // Create a new shard
        const newShardRef = doc(collection(db, 'connectionShards'));
        const newShard: ConnectionShard = {
          shardId: newShardRef.id,
          userId: userId,
          connections: [],
        };
        
        await updateDoc(newShardRef, {
          userId: userId,
          connections: [],
        });
        
        targetShard = newShard;
      }
      
      // Add connection to shard
      const updatedConnections = [...targetShard.connections, connectionId];
      
      await updateDoc(doc(db, 'connectionShards', targetShard.shardId), {
        connections: updatedConnections,
      });
    } catch (error) {
      console.error('Error updating connection shards:', error);
      throw error;
    }
  }
  
  /**
   * Remove from connection shards
   * @param userId User ID
   * @param connectionId Connection ID
   */
  async removeFromConnectionShards(userId: string, connectionId: string): Promise<void> {
    try {
      // Fetch user's connection shards
      const shardsSnapshot = await getDocs(
        query(collection(db, 'connectionShards'), where('userId', '==', userId))
      );
      
      const shards: ConnectionShard[] = [];
      shardsSnapshot.forEach(doc => {
        shards.push({ ...doc.data(), shardId: doc.id } as ConnectionShard);
      });
      
      // Find the shard containing this connection
      const targetShard = shards.find(s => s.connections.includes(connectionId));
      
      if (targetShard) {
        // Remove connection from shard
        const updatedConnections = targetShard.connections.filter(id => id !== connectionId);
        
        await updateDoc(doc(db, 'connectionShards', targetShard.shardId), {
          connections: updatedConnections,
        });
      }
    } catch (error) {
      console.error('Error removing from connection shards:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const connectionService = new ConnectionService();

/**
 * Hook for using connections in components
 * @param user User object
 * @returns Connection state and functions
 */
export function useConnections(user: any) {
  const [connections, setConnections] = useState<EnhancedConnection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<EnhancedConnection[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<EnhancedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreConnections, setHasMoreConnections] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const allConnections = await connectionService.fetchConnections(user.id);
      
      // Fetch user profiles for each connection
      const enhancedConnections: EnhancedConnection[] = [];
      
      for (const connection of allConnections) {
        const enhancedConnection = await connectionService.fetchConnectionUserProfile(connection, user.id);
        enhancedConnections.push(enhancedConnection);
      }
      
      // Update state
      setConnections(enhancedConnections.filter(c => c.status === ConnectionStatus.ACCEPTED));
      setPendingConnections(enhancedConnections.filter(c => c.status === ConnectionStatus.PENDING));
      setSuggestedConnections([]); // Suggestions would be fetched separately
      
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);
  
  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user, fetchConnections]);
  
  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConnections();
  }, [fetchConnections]);
  
  // Handle connect action
  const handleConnect = useCallback(async (id: string, action: 'accept' | 'reject' | 'connect' | 'message') => {
    if (!user) return;
    
    try {
      if (action === 'accept') {
        // Accept connection request
        await connectionService.acceptConnectionRequest(user.id, id);
        
        // Update local state
        const connection = pendingConnections.find(c => 
          c.userId === id || c.connectionId === id
        );
        
        if (connection) {
          // Move from pending to connections
          setPendingConnections(prev => 
            prev.filter(c => c.id !== connection.id)
          );
          setConnections(prev => [
            {
              ...connection,
              status: ConnectionStatus.ACCEPTED,
              connectionDate: Timestamp.now(),
              lastInteraction: Timestamp.now(),
            },
            ...prev,
          ]);
        }
      } else if (action === 'reject') {
        // Reject connection request
        await connectionService.declineConnectionRequest(user.id, id);
        
        // Update local state
        setPendingConnections(prev => 
          prev.filter(c => 
            !(c.userId === id || c.connectionId === id)
          )
        );
      } else if (action === 'connect') {
        // Send connection request
        await connectionService.sendConnectionRequest(user.id, id);
        
        // Update local state
        const connection = suggestedConnections.find(c => c.connectionId === id);
        
        if (connection) {
          // Move from suggested to pending
          setSuggestedConnections(prev => prev.filter(c => c.connectionId !== id));
          setPendingConnections(prev => [
            {
              ...connection,
              status: ConnectionStatus.PENDING,
              connectionRequest: {
                sentBy: user.id,
                sentAt: Timestamp.now(),
              },
            },
            ...prev,
          ]);
        }
      }
      // 'message' action would be handled by navigation
      
    } catch (error) {
      console.error(`Error handling ${action} action:`, error);
    }
  }, [user, pendingConnections, suggestedConnections]);
  
  // Load more connections
  const loadMoreConnections = useCallback(async () => {
    if (!user || isLoadingMore || !hasMoreConnections) return;
    
    try {
      setIsLoadingMore(true);
      
      // Implement pagination logic here
      // This would fetch the next page of connections from the server
      
      setCurrentPage(prev => prev + 1);
      
      // If no more connections, set hasMoreConnections to false
      // setHasMoreConnections(false);
      
    } catch (error) {
      console.error('Error loading more connections:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, isLoadingMore, hasMoreConnections]);
  
  return {
    connections,
    pendingConnections,
    suggestedConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
    unreadMessages,
    isLoadingMore,
    hasMoreConnections,
    loadMoreConnections,
  };
}