// app/services/chatService.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot,
  Timestamp,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { Message } from '../models/connection/types';
import { webSocketService } from './websocketService';
import { encryptionService } from './encryptionService';

// Constants
const MESSAGES_PER_PAGE = 20;
const MESSAGES_CACHE_KEY = 'chat_messages_cache';

/**
 * Service for handling chat operations
 */
export class ChatService {
  private messageListeners: { [key: string]: () => void } = {};

  /**
   * Send a message
   * @param senderId Sender ID
   * @param receiverId Receiver ID
   * @param content Message content
   * @param isEncrypted Whether the message is encrypted
   * @returns Promise resolving to the sent message
   */
  async sendMessage(
    senderId: string, 
    receiverId: string, 
    content: string, 
    isEncrypted: boolean = false
  ): Promise<Message> {
    try {
      // Create chat ID (combination of both user IDs, alphabetically sorted)
      const chatId = [senderId, receiverId].sort().join('_');
      
      // Create message object
      const message: Omit<Message, 'id'> = {
        senderId,
        receiverId,
        content,
        timestamp: Timestamp.now() as any,
        isEncrypted,
        status: 'sent',
        messageType: 'text',
      };
      
      // Add message to Firestore
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), message);
      
      // Update chat metadata
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: content,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: senderId,
        unreadCount: {
          [receiverId]: (await this.getUnreadCount(chatId, receiverId)) + 1,
        },
      });
      
      // Send via WebSocket for real-time delivery
      if (webSocketService.isConnected()) {
        webSocketService.sendMessage({
          ...message,
          id: messageRef.id,
          timestamp: new Date(),
        });
      }
      
      return {
        ...message,
        id: messageRef.id,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  /**
   * Get messages for a chat
   * @param userId Current user ID
   * @param otherUserId Other user ID
   * @param lastMessageTimestamp Timestamp of the last message (for pagination)
   * @returns Promise resolving to messages
   */
  async getMessages(
    userId: string, 
    otherUserId: string, 
    lastMessageTimestamp?: Timestamp
  ): Promise<Message[]> {
    try {
      // Create chat ID (combination of both user IDs, alphabetically sorted)
      const chatId = [userId, otherUserId].sort().join('_');
      
      // Create query
      let messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(MESSAGES_PER_PAGE)
      );
      
      // Add pagination if lastMessageTimestamp is provided
      if (lastMessageTimestamp) {
        messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'desc'),
          startAfter(lastMessageTimestamp),
          limit(MESSAGES_PER_PAGE)
        );
      }
      
      // Get messages
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Convert to Message objects
      const messages: Message[] = [];
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          isEncrypted: data.isEncrypted,
          status: data.status,
          messageType: data.messageType,
        });
      });
      
      // Mark messages as read
      await this.markMessagesAsRead(chatId, userId);
      
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to messages for a chat
   * @param userId Current user ID
   * @param otherUserId Other user ID
   * @param callback Callback function for new messages
   * @returns Unsubscribe function
   */
  subscribeToMessages(
    userId: string, 
    otherUserId: string, 
    callback: (messages: Message[]) => void
  ): () => void {
    // Create chat ID (combination of both user IDs, alphabetically sorted)
    const chatId = [userId, otherUserId].sort().join('_');
    
    // Create listener key
    const listenerKey = `${userId}_${otherUserId}`;
    
    // Unsubscribe from existing listener if any
    if (this.messageListeners[listenerKey]) {
      this.messageListeners[listenerKey]();
    }
    
    // Create query for recent messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );
    
    // Subscribe to query
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          isEncrypted: data.isEncrypted,
          status: data.status,
          messageType: data.messageType,
        });
      });
      
      // Call callback with messages
      callback(messages);
      
      // Mark messages as read if they're from the other user
      this.markMessagesAsRead(chatId, userId);
    });
    
    // Store unsubscribe function
    this.messageListeners[listenerKey] = unsubscribe;
    
    return unsubscribe;
  }
  
  /**
   * Mark messages as read
   * @param chatId Chat ID
   * @param userId Current user ID
   */
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Update chat metadata
      await updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${userId}`]: 0,
      });
      
      // Update message status
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        where('receiverId', '==', userId),
        where('status', '!=', 'read')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Update each message
      const batch = messagesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { status: 'read' })
      );
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
  
  /**
   * Get unread count for a chat
   * @param chatId Chat ID
   * @param userId User ID
   * @returns Promise resolving to unread count
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        return data.unreadCount?.[userId] || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
  
  /**
   * Get total unread messages count across all chats
   * @param userId User ID
   * @returns Promise resolving to total unread count
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where(`unreadCount.${userId}`, '>', 0)
      );
      
      const chatsSnapshot = await getDocs(chatsQuery);
      
      let totalUnread = 0;
      chatsSnapshot.forEach(doc => {
        const data = doc.data();
        totalUnread += data.unreadCount?.[userId] || 0;
      });
      
      return totalUnread;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const chatService = new ChatService();

/**
 * Hook for using chat in components
 * @param currentUserId Current user ID
 * @param otherUserId Other user ID
 * @returns Chat state and functions
 */
export function useChat(currentUserId: string | null, otherUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageTimestampRef = useRef<Timestamp | null>(null);
  
  // Load messages
  const loadMessages = useCallback(async (refresh: boolean = false) => {
    if (!currentUserId || !otherUserId) return;
    
    try {
      setIsLoading(true);
      
      // If refresh, reset pagination
      if (refresh) {
        lastMessageTimestampRef.current = null;
      }
      
      const loadedMessages = await chatService.getMessages(
        currentUserId, 
        otherUserId, 
        lastMessageTimestampRef.current || undefined
      );
      
      // Update messages
      if (refresh) {
        setMessages(loadedMessages);
      } else {
        setMessages(prev => [...prev, ...loadedMessages]);
      }
      
      // Update pagination state
      if (loadedMessages.length < MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      } else {
        setHasMoreMessages(true);
        // Update last message timestamp for pagination
        const lastMessage = loadedMessages[loadedMessages.length - 1];
        lastMessageTimestampRef.current = Timestamp.fromDate(lastMessage.timestamp);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, otherUserId]);
  
  // Subscribe to messages
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;
    
    // Initial load
    loadMessages(true);
    
    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToMessages(
      currentUserId,
      otherUserId,
      (newMessages) => {
        setMessages(newMessages);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [currentUserId, otherUserId, loadMessages]);
  
  // Get unread count
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;
    
    const chatId = [currentUserId, otherUserId].sort().join('_');
    
    const getCount = async () => {
      const count = await chatService.getUnreadCount(chatId, currentUserId);
      setUnreadCount(count);
    };
    
    getCount();
  }, [currentUserId, otherUserId]);
  
  // Send message function
  const sendMessage = useCallback(async (content: string, isEncrypted: boolean = false) => {
    if (!currentUserId || !otherUserId || !content.trim()) return null;
    
    try {
      // If encryption is enabled, encrypt the message
      let processedContent = content;
      
      if (isEncrypted) {
        // Get recipient's public key
        const recipientDoc = await getDoc(doc(db, 'users', otherUserId));
        
        if (recipientDoc.exists() && recipientDoc.data().publicKey) {
          processedContent = await encryptionService.encryptMessage(
            content,
            recipientDoc.data().publicKey
          );
        }
      }
      
      // Send message
      const message = await chatService.sendMessage(
        currentUserId,
        otherUserId,
        processedContent,
        isEncrypted
      );
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [currentUserId, otherUserId]);
  
  return {
    messages,
    isLoading,
    hasMoreMessages,
    unreadCount,
    loadMessages,
    sendMessage,
    loadMoreMessages: () => loadMessages(false),
  };
}

// Add default export
export default ChatService;