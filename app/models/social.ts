// app/models/social.ts
import { Timestamp } from 'firebase/firestore';

// Enum for content types
export enum ContentType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
  MIXED = 'mixed'
}

// Enum for privacy settings
export enum PrivacyLevel {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  PRIVATE = 'private'
}

// User connection status
export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
  DECLINED = 'declined'
}

// Post/Content interface
export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrls?: string[];
  contentType: ContentType;
  privacyLevel: PrivacyLevel;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Timestamp;
  tags?: string[];
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
}

// Interaction interface
export interface PostInteraction {
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'like' | 'comment' | 'share';
  timestamp: Timestamp;
}

export interface SocialNotification {
  // Existing definitions
}


// Comment interface
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
  parentCommentId?: string; // For nested comments/replies
}

// Enhanced Connection interface
export interface Connection {
  id: string;
  userId: string;
  connectionId: string;
  status: ConnectionStatus;
  connectionDate?: Timestamp;
  lastInteraction?: Timestamp;
  mutualConnections?: string[];
  connectionRequest?: {
    sentBy: string;
    sentAt: Timestamp;
  };
}

// User Profile Extension
export interface SocialProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  location?: string;
  websiteUrl?: string;
  profileImage?: string;
  coverImage?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  followers: number;
  following: number;
  totalPosts: number;
  interests?: string[];
  professionalInfo?: {
    company?: string;
    position?: string;
    industry?: string;
  };
  privacySettings?: {
    profileVisibility: PrivacyLevel;
    connectionRequestsFrom: 'everyone' | 'mutual' | 'none';
  };
  verificationStatus?: 'unverified' | 'pending' | 'verified';
}

// Notification interface for social interactions
export interface SocialNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'connection_request' | 'connection_accepted';
  relatedUserId: string;
  relatedPostId?: string;
  read: boolean;
  createdAt: Timestamp;
}

// Create a SocialModels class that can be exported as default
export class SocialModels {
  static ContentType = ContentType;
  static PrivacyLevel = PrivacyLevel;
  static ConnectionStatus = ConnectionStatus;
}

// Add default export
export default SocialModels;