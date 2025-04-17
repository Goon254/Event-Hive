// app/services/social/ConnectionService.ts
import { auth } from '../../../lib/firebaseConfig';
import { RepositoryFactory } from '../../repositories/RepositoryFactory';
import { Connection, ConnectionStatus } from '../../models/social';

/**
 * Service for user connection-related operations
 */
export class ConnectionService {
  private connectionRepository = RepositoryFactory.getConnectionRepository();

  /**
   * Send a connection request to another user
   * @param connectionId Target user ID
   * @returns Promise resolving when the request is sent
   */
  async sendConnectionRequest(connectionId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Don't allow sending connection requests to yourself
      if (currentUser.uid === connectionId) {
        throw new Error('Cannot send connection request to yourself');
      }

      await this.connectionRepository.sendConnectionRequest(currentUser.uid, connectionId);
    } catch (error) {
      console.error('Error in ConnectionService.sendConnectionRequest:', error);
      throw error;
    }
  }

  /**
   * Accept a connection request
   * @param connectionId User ID who sent the request
   * @returns Promise resolving when the request is accepted
   */
  async acceptConnectionRequest(connectionId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.connectionRepository.acceptConnectionRequest(currentUser.uid, connectionId);
    } catch (error) {
      console.error('Error in ConnectionService.acceptConnectionRequest:', error);
      throw error;
    }
  }

  /**
   * Decline a connection request
   * @param connectionId User ID who sent the request
   * @returns Promise resolving when the request is declined
   */
  async declineConnectionRequest(connectionId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.connectionRepository.declineConnectionRequest(currentUser.uid, connectionId);
    } catch (error) {
      console.error('Error in ConnectionService.declineConnectionRequest:', error);
      throw error;
    }
  }

  /**
   * Remove an existing connection
   * @param connectionId Connected user ID
   * @returns Promise resolving when the connection is removed
   */
  async removeConnection(connectionId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await this.connectionRepository.removeConnection(currentUser.uid, connectionId);
    } catch (error) {
      console.error('Error in ConnectionService.removeConnection:', error);
      throw error;
    }
  }

  /**
   * Get all connections for the current user
   * @returns Promise resolving to an array of connections
   */
  async getUserConnections(): Promise<Connection[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      return await this.connectionRepository.getUserConnections(currentUser.uid);
    } catch (error) {
      console.error('Error in ConnectionService.getUserConnections:', error);
      throw error;
    }
  }

  /**
   * Get connections for a specific user
   * @param userId User ID
   * @returns Promise resolving to an array of connections
   */
  async getConnectionsForUser(userId: string): Promise<Connection[]> {
    try {
      return await this.connectionRepository.getUserConnections(userId);
    } catch (error) {
      console.error('Error in ConnectionService.getConnectionsForUser:', error);
      throw error;
    }
  }

  /**
   * Get pending connection requests for the current user
   * @returns Promise resolving to an array of pending connection requests
   */
  async getPendingConnectionRequests(): Promise<Connection[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      return await this.connectionRepository.getPendingConnectionRequests(currentUser.uid);
    } catch (error) {
      console.error('Error in ConnectionService.getPendingConnectionRequests:', error);
      throw error;
    }
  }

  /**
   * Check if a connection exists between the current user and another user
   * @param userId User ID to check connection with
   * @returns Promise resolving to the connection status or null if no connection exists
   */
  async getConnectionStatus(userId: string): Promise<ConnectionStatus | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      return await this.connectionRepository.getConnectionStatus(currentUser.uid, userId);
    } catch (error) {
      console.error('Error in ConnectionService.getConnectionStatus:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const connectionService = new ConnectionService();