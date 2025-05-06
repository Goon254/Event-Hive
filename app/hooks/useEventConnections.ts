// app/hooks/useEventConnections.ts
import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  EnhancedConnection, 
  ConnectionStatus 
} from '../models/connection/types';
import eventConnectionService from '../services/eventConnectionService';

/**
 * Hook for using event-based connections in components
 * This streamlined version only allows connections between users who attended the same event
 * @param user Current user object
 * @returns Connection state and functions
 */
export function useEventConnections(user: any) {
  const [connections, setConnections] = useState<EnhancedConnection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<EnhancedConnection[]>([]);
  const [potentialConnections, setPotentialConnections] = useState<EnhancedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get accepted connections
      const userConnections = await eventConnectionService.getUserConnections(user.id);
      setConnections(userConnections);
      
      // Get pending connection requests
      const pendingRequests = await eventConnectionService.getPendingConnectionRequests(user.id);
      setPendingConnections(pendingRequests);
      
      // Get potential connections (users who attended the same events)
      const potentialUsers = await eventConnectionService.getPotentialConnections(user.id);
      setPotentialConnections(potentialUsers);
      
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
  
  // Handle connection actions
  const handleConnect = useCallback(async (id: string, action: 'accept' | 'reject' | 'connect' | 'follow') => {
    if (!user) return;
    
    try {
      if (action === 'accept') {
        // Accept connection request
        await eventConnectionService.acceptConnectionRequest(user.id, id);
        
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
            },
            ...prev,
          ]);
        }
      } else if (action === 'reject') {
        // Reject connection request
        await eventConnectionService.declineConnectionRequest(user.id, id);
        
        // Update local state
        setPendingConnections(prev => 
          prev.filter(c => 
            !(c.userId === id || c.connectionId === id)
          )
        );
      } else if (action === 'connect') {
        // Send connection request
        const connectionId = await eventConnectionService.sendConnectionRequest(user.id, id);
        
        if (connectionId) {
          // Update local state - remove from potential connections
          setPotentialConnections(prev => 
            prev.filter(c => c.connectionId !== id)
          );
          
          // Show success message
          console.log('Connection request sent successfully');
        } else {
          // Show error message
          console.log('Connection not allowed: Users did not attend the same event');
        }
      } else if (action === 'follow') {
        // Follow an organizer
        const connectionId = await eventConnectionService.followOrganizer(user.id, id);
        
        if (connectionId) {
          // Update local state - remove from potential connections
          setPotentialConnections(prev => 
            prev.filter(c => c.connectionId !== id)
          );
          
          // Add to connections
          const connection = potentialConnections.find(c => c.connectionId === id);
          if (connection) {
            setConnections(prev => [
              {
                ...connection,
                id: connectionId,
                status: ConnectionStatus.ACCEPTED,
                connectionDate: Timestamp.now(),
              },
              ...prev,
            ]);
          }
          
          // Show success message
          console.log('Now following organizer');
        } else {
          // Show error message
          console.log('Follow not allowed: Target user is not an event organizer');
        }
      }
    } catch (error) {
      console.error(`Error handling ${action} action:`, error);
    }
  }, [user, pendingConnections, potentialConnections]);
  
  // Check if a user is an organizer
  const checkIfOrganizer = useCallback(async (userId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      return await eventConnectionService.isUserEventOrganizer(userId);
    } catch (error) {
      console.error('Error checking if user is an organizer:', error);
      return false;
    }
  }, [user]);
  
  return {
    connections,
    pendingConnections,
    potentialConnections,
    isLoading,
    refreshing,
    onRefresh,
    handleConnect,
    checkIfOrganizer,
  };
}

export default useEventConnections;