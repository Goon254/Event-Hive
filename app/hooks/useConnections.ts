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
      
      // Generate recommendations
      generateRecommendations();
      
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);
  
  // Generate connection recommendations
  const generateRecommendations = useCallback(async () => {
    if (!user) return;
    
    try {
      // This would typically call an API to get recommendations
      // For now, we'll just create some dummy recommendations
      const dummyRecommendations: EnhancedConnection[] = [
        {
          id: 'rec_1',
          userId: user.id,
          connectionId: 'rec_user_1',
          status: ConnectionStatus.PENDING,
          name: 'Jane Smith',
          role: 'Product Manager',
          mutualConnections: 3,
          recommendationScore: 0.85,
          recommendationReason: 'Based on your interests',
        },
        {
          id: 'rec_2',
          userId: user.id,
          connectionId: 'rec_user_2',
          status: ConnectionStatus.PENDING,
          name: 'John Doe',
          role: 'Software Engineer',
          mutualConnections: 5,
          recommendationScore: 0.92,
          recommendationReason: '5 mutual connections',
        },
      ];
      
      setSuggestedConnections(dummyRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
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
  
  // Update unread message count
  const updateUnreadMessageCount = useCallback((senderId: string, count: number) => {
    setUnreadMessages(prev => ({
      ...prev,
      [senderId]: (prev[senderId] || 0) + count,
    }));
  }, []);
  
  // Clear unread message count
  const clearUnreadMessageCount = useCallback((senderId: string) => {
    setUnreadMessages(prev => {
      const newCounts = { ...prev };
      delete newCounts[senderId];
      return newCounts;
    });
  }, []);
  
  return {
    connections,
    pendingConnections,
    suggestedConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
    unreadMessages,
    updateUnreadMessageCount,
    clearUnreadMessageCount,
    isLoadingMore,
    hasMoreConnections,
    loadMoreConnections,
  };
}