// app/services/websocketService.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import ioClient, { Socket as SocketType } from 'socket.io-client';
import { Message, EnhancedConnection } from '../models/connection/types';

// WebSocket server URL
const WEBSOCKET_SERVER_URL = 'wss://api.scangoapp.com/ws';

/**
 * WebSocket Service for handling real-time communication
 */
export class WebSocketService {
  private socket: ReturnType<typeof ioClient> | null = null;
  private userId: string | null = null;
  
  // Event callbacks
  private onMessageCallback: ((message: Message) => void) | null = null;
  private onConnectionRequestCallback: ((connection: EnhancedConnection) => void) | null = null;
  private onConnectionAcceptedCallback: ((connection: EnhancedConnection) => void) | null = null;
  private onUserOnlineCallback: ((userId: string) => void) | null = null;
  private onUserOfflineCallback: ((userId: string) => void) | null = null;
  
  /**
   * Initialize WebSocket connection
   * @param userId User ID for authentication
   */
  initialize(userId: string): void {
    this.userId = userId;
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = ioClient(WEBSOCKET_SERVER_URL, {
      auth: { token: userId },
      transports: ['websocket'],
    });
    
    this.setupEventListeners();
  }
  
  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    
    this.socket.on('message', (message: Message) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    });
    
    this.socket.on('connection_request', (connection: EnhancedConnection) => {
      if (this.onConnectionRequestCallback) {
        this.onConnectionRequestCallback(connection);
      }
    });
    
    this.socket.on('connection_accepted', (connection: EnhancedConnection) => {
      if (this.onConnectionAcceptedCallback) {
        this.onConnectionAcceptedCallback(connection);
      }
    });
    
    this.socket.on('user_online', (userId: string) => {
      if (this.onUserOnlineCallback) {
        this.onUserOnlineCallback(userId);
      }
    });
    
    this.socket.on('user_offline', (userId: string) => {
      if (this.onUserOfflineCallback) {
        this.onUserOfflineCallback(userId);
      }
    });
  }
  
  /**
   * Register callback for message events
   * @param callback Function to call when a message is received
   */
  onMessage(callback: (message: Message) => void): void {
    this.onMessageCallback = callback;
  }
  
  /**
   * Register callback for connection request events
   * @param callback Function to call when a connection request is received
   */
  onConnectionRequest(callback: (connection: EnhancedConnection) => void): void {
    this.onConnectionRequestCallback = callback;
  }
  
  /**
   * Register callback for connection accepted events
   * @param callback Function to call when a connection is accepted
   */
  onConnectionAccepted(callback: (connection: EnhancedConnection) => void): void {
    this.onConnectionAcceptedCallback = callback;
  }
  
  /**
   * Register callback for user online events
   * @param callback Function to call when a user comes online
   */
  onUserOnline(callback: (userId: string) => void): void {
    this.onUserOnlineCallback = callback;
  }
  
  /**
   * Register callback for user offline events
   * @param callback Function to call when a user goes offline
   */
  onUserOffline(callback: (userId: string) => void): void {
    this.onUserOfflineCallback = callback;
  }
  
  /**
   * Send a message via WebSocket
   * @param message Message to send
   */
  sendMessage(message: Message): void {
    if (this.socket?.connected) {
      this.socket.emit('message', message);
    }
  }
  
  /**
   * Send a connection request via WebSocket
   * @param request Connection request data
   */
  sendConnectionRequest(request: any): void {
    if (this.socket?.connected) {
      this.socket.emit('connection_request', request);
    }
  }
  
  /**
   * Send a connection accepted notification via WebSocket
   * @param data Connection accepted data
   */
  sendConnectionAccepted(data: any): void {
    if (this.socket?.connected) {
      this.socket.emit('connection_accepted', data);
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  /**
   * Check if WebSocket is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

/**
 * Hook for using WebSocket in components
 * @param userId User ID for authentication
 * @returns WebSocket state and service
 */
export function useWebSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [pendingRequests, setPendingRequests] = useState<EnhancedConnection[]>([]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Initialize WebSocket
    webSocketService.initialize(userId);
    
    // Setup event listeners
    webSocketService.onMessage((message) => {
      setLastMessage(message);
    });
    
    webSocketService.onConnectionRequest((connection) => {
      setPendingRequests(prev => [connection, ...prev]);
    });
    
    // Check connection status periodically
    const checkConnection = () => {
      setIsConnected(webSocketService.isConnected());
    };
    
    const interval = setInterval(checkConnection, 5000);
    checkConnection();
    
    // Cleanup
    return () => {
      clearInterval(interval);
      webSocketService.disconnect();
    };
  }, [userId]);
  
  // Send message function
  const sendMessage = useCallback((message: Message) => {
    if (webSocketService.isConnected()) {
      webSocketService.sendMessage(message);
      return true;
    }
    return false;
  }, []);
  
  return {
    isConnected,
    lastMessage,
    pendingRequests,
    sendMessage,
    disconnect: () => webSocketService.disconnect(),
  };
}