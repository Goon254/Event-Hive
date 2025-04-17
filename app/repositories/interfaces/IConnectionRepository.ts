// app/repositories/interfaces/IConnectionRepository.ts
import { IRepository } from './IRepository';
import { Connection, ConnectionStatus } from '../../models/social';

/**
 * Interface for user connection repository operations
 */
export interface IConnectionRepository extends IRepository<Connection> {
  /**
   * Send a connection request to another user
   * @param userId Current user ID
   * @param connectionId Target user ID
   * @returns Promise resolving when the request is sent
   */
  sendConnectionRequest(userId: string, connectionId: string): Promise<void>;

  /**
   * Accept a connection request
   * @param userId Current user ID
   * @param connectionId User ID who sent the request
   * @returns Promise resolving when the request is accepted
   */
  acceptConnectionRequest(userId: string, connectionId: string): Promise<void>;

  /**
   * Decline a connection request
   * @param userId Current user ID
   * @param connectionId User ID who sent the request
   * @returns Promise resolving when the request is declined
   */
  declineConnectionRequest(userId: string, connectionId: string): Promise<void>;

  /**
   * Remove an existing connection
   * @param userId Current user ID
   * @param connectionId Connected user ID
   * @returns Promise resolving when the connection is removed
   */
  removeConnection(userId: string, connectionId: string): Promise<void>;

  /**
   * Get all connections for a user
   * @param userId User ID
   * @returns Promise resolving to an array of connections
   */
  getUserConnections(userId: string): Promise<Connection[]>;

  /**
   * Get pending connection requests for a user
   * @param userId User ID
   * @returns Promise resolving to an array of pending connection requests
   */
  getPendingConnectionRequests(userId: string): Promise<Connection[]>;

  /**
   * Check if a connection exists between two users
   * @param userId First user ID
   * @param connectionId Second user ID
   * @returns Promise resolving to the connection status or null if no connection exists
   */
  getConnectionStatus(userId: string, connectionId: string): Promise<ConnectionStatus | null>;
}

// Add default export
export default IConnectionRepository;