// app/models/connection/types.ts
import { Timestamp } from 'firebase/firestore';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked'
}

export interface Connection {
  id: string;
  userId: string;
  connectionId: string;
  status: ConnectionStatus;
  connectionDate?: Date | Timestamp;
  connectionRequest?: {
    sentBy: string;
    sentAt: Date | Timestamp;
  };
}

export interface EnhancedConnection extends Omit<Connection, 'lastInteraction' | 'mutualConnections'> {
  name: string;
  avatar?: string;
  role?: string;
  mutualConnections?: number | string[];
  recentEvent?: string;
  lastInteraction?: Timestamp | Date;
  encryptedData?: string;
  publicKey?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp | Date;
  recommendationScore?: number;
  recommendationReason?: string;
  shardId?: string;
}

export interface ContactMatch {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  isRegistered: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isEncrypted: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  messageType: 'text' | 'image' | 'file' | 'location';
}

export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
}

export interface ConnectionShard {
  shardId: string;
  userId: string;
  connections: string[]; // Connection IDs
}

export interface ConnectionCache {
  connections: EnhancedConnection[];
  timestamp: number;
  expiresAt: number;
}

export interface PrivacySettings {
  // Basic privacy
  showOnlineStatus: boolean;
  allowContactDiscovery: boolean;
  allowRecommendations: boolean;
  encryptMessages: boolean;
  
  // User data controls
  allowDataCollection?: boolean;
  allowUsageAnalytics?: boolean;
  allowCrashReporting?: boolean;
  
  // Permission management
  cameraPermission?: boolean;
  locationPermission?: boolean;
  contactsPermission?: boolean;
  notificationsPermission?: boolean;
  
  // Tracking preferences
  allowAdPersonalization?: boolean;
  allowCrossSiteTracking?: boolean;
  
  // Third-party data sharing
  allowThirdPartySharing?: boolean;
  allowPartnerSharing?: boolean;
  
  // Notification privacy
  hideNotificationContent?: boolean;
  muteNotificationsWhenActive?: boolean;
  
  // Content visibility
  profileVisibility?: 'public' | 'connections' | 'private';
  activityVisibility?: 'public' | 'connections' | 'private';
  
  // Security
  twoFactorEnabled?: boolean;
  biometricLoginEnabled?: boolean;
  autoLockEnabled?: boolean;
  passwordChangeRequired?: boolean;
}

// Create a ConnectionTypes class that can be exported as default
export class ConnectionTypes {
  static ConnectionStatus = ConnectionStatus;
}

// Add default export
export default ConnectionTypes;