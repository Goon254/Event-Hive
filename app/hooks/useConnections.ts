// app/hooks/useConnections.ts
import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { EnhancedConnection, ConnectionStatus } from '../models/connection/types';
import { connectionService } from '../services/connectionService';

/**
 * Hook for managing connections
 * @param user User object
 * @returns Connection state and functions
 */
export function useConnections(user: any) {
  const [connections, setConnections] = useState<EnhancedConnection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<EnhancedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreConnections, setHasMoreConnections] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisibleConnection, setLastVisibleConnection] = useState<any>(null);
  
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
      const acceptedConnections = enhancedConnections.filter(c => c.status === ConnectionStatus.ACCEPTED);
      const pendingConns = enhancedConnections.filter(c => c.status === ConnectionStatus.PENDING);
      
      setConnections(acceptedConnections);
      setPendingConnections(pendingConns);
      
      // Set last visible connection for pagination
      if (acceptedConnections.length > 0) {
        setLastVisibleConnection(acceptedConnections[acceptedConnections.length - 1]);
      }
      
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
        
        // Add to pending connections
        // Note: We're not managing suggested connections here anymore
        // as they're handled by the useRecommendations hook
      }
      // 'message' action would be handled by navigation
      
    } catch (error) {
      console.error(`Error handling ${action} action:`, error);
    }
  }, [user, pendingConnections]);
  
  // Load more connections
  const loadMoreConnections = useCallback(async () => {
    if (!user || isLoadingMore || !hasMoreConnections || !lastVisibleConnection) return;
    
    try {
      setIsLoadingMore(true);
      
      // Fetch next page of connections
      const nextPageConnections = await connectionService.fetchConnectionsPage(
        user.id,
        lastVisibleConnection,
        10 // Page size
      );
      
      if (nextPageConnections.length === 0) {
        setHasMoreConnections(false);
        return;
      }
      
      // Fetch user profiles for each connection
      const enhancedConnections: EnhancedConnection[] = [];
      
      for (const connection of nextPageConnections) {
        const enhancedConnection = await connectionService.fetchConnectionUserProfile(connection, user.id);
        enhancedConnections.push(enhancedConnection);
      }
      
      // Filter accepted connections
      const acceptedConnections = enhancedConnections.filter(c => c.status === ConnectionStatus.ACCEPTED);
      
      // Update state
      setConnections(prev => [...prev, ...acceptedConnections]);
      setCurrentPage(prev => prev + 1);
      
      // Update last visible connection
      if (acceptedConnections.length > 0) {
        setLastVisibleConnection(acceptedConnections[acceptedConnections.length - 1]);
      } else {
        setHasMoreConnections(false);
      }
      
    } catch (error) {
      console.error('Error loading more connections:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, isLoadingMore, hasMoreConnections, lastVisibleConnection]);
  
  // These functions are now handled by the chatService
  const updateUnreadMessageCount = useCallback((senderId: string, count: number) => {
    // Implementation moved to chatService
    console.log('Updating unread count for', senderId, count);
  }, []);
  
  // Clear unread message count
  const clearUnreadMessageCount = useCallback((senderId: string) => {
    // Implementation moved to chatService
    console.log('Clearing unread count for', senderId);
  }, []);
  
  return {
    connections,
    pendingConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
    updateUnreadMessageCount,
    clearUnreadMessageCount,
    isLoadingMore,
    hasMoreConnections,
    loadMoreConnections,
  };
}

// Add default export
export default useConnections;