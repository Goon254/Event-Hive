# Firestore Implementation Guide for ScanGo Social Feed

This document provides a comprehensive guide for implementing Firebase Firestore in the ScanGo social feed feature.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Data Structure](#data-structure)
4. [Security Rules](#security-rules)
5. [Performance Optimization](#performance-optimization)
6. [Migration Strategy](#migration-strategy)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Local Development vs Production](#local-development-vs-production)
10. [Troubleshooting](#troubleshooting)

## Overview

The ScanGo social feed has been implemented using Firebase Firestore as the backend database. This implementation provides:

- Real-time updates for posts and comments
- Efficient data querying with proper indexing
- Secure data access with Firestore security rules
- Offline persistence for better user experience
- Scalable architecture for future growth

## Setup Instructions

### Prerequisites

- Firebase project with Firestore enabled
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase configuration in `lib/firebaseConfig.tsx`

### Deployment Steps

1. **Deploy Firestore Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Initialize Database** (for new environments):
   ```javascript
   import { migrationService } from './app/services/migrationService';
   
   // Call this after user authentication
   await migrationService.initializeDatabase();
   ```

4. **Seed Initial Data** (for development/testing):
   ```javascript
   import { migrationService } from './app/services/migrationService';
   
   // Call this after user authentication
   await migrationService.seedInitialData();
   ```

## Data Structure

### Collections

1. **socialPosts**
   - Main collection for all social posts
   - Contains subcollections: `likes`, `comments`

2. **users**
   - User profiles and metadata
   - Contains social-specific fields like followers, following counts

3. **connections**
   - Represents connections between users
   - Used for privacy controls and friend/follow functionality

4. **notifications**
   - Stores notifications for likes, comments, connection requests, etc.

### Document Structure Examples

#### Social Post
```javascript
{
  id: 'post123',
  userId: 'user456',
  userName: 'John Doe',
  userAvatar: 'https://example.com/avatar.jpg',
  content: 'This is a post',
  mediaUrls: ['https://example.com/image.jpg'],
  contentType: 'mixed',
  privacyLevel: 'public',
  likes: 10,
  comments: 5,
  shares: 2,
  createdAt: Timestamp(...)
}
```

#### Comment
```javascript
{
  id: 'comment123',
  postId: 'post123',
  userId: 'user789',
  userName: 'Jane Smith',
  userAvatar: 'https://example.com/avatar2.jpg',
  content: 'Great post!',
  createdAt: Timestamp(...),
  likes: 2,
  parentCommentId: null // For replies
}
```

#### Connection
```javascript
{
  id: 'user123_user456', // Smaller ID first for consistency
  userId: 'user123',
  connectionId: 'user456',
  status: 'accepted', // pending, accepted, declined, blocked
  connectionDate: Timestamp(...),
  lastInteraction: Timestamp(...),
  connectionRequest: {
    sentBy: 'user123',
    sentAt: Timestamp(...)
  }
}
```

#### Notification
```javascript
{
  id: 'notif123',
  userId: 'user456', // Recipient
  type: 'like', // like, comment, connection_request, etc.
  relatedUserId: 'user123', // Sender
  relatedUserName: 'John Doe',
  relatedUserAvatar: 'https://example.com/avatar.jpg',
  relatedPostId: 'post789', // Optional, depends on type
  read: false,
  createdAt: Timestamp(...)
}
```

## Security Rules

The security rules in `firestore.rules` implement the following access controls:

- **Public Posts**: Readable by anyone
- **Connections-Only Posts**: Readable only by the author and their connections
- **Private Posts**: Readable only by the author
- **Post Creation**: Only authenticated users can create posts
- **Post Updates/Deletion**: Only the post author can update or delete
- **Comments**: Anyone can read, only authenticated users can create
- **Connections**: Only the involved users can read/write
- **Notifications**: Only the recipient can read/write

See `firestore.rules` for the complete implementation.

## Performance Optimization

### Implemented Optimizations

1. **Indexing**:
   - Custom indexes for common queries (see `firestore.indexes.json`)
   - Composite indexes for filtered and sorted queries

2. **Denormalization**:
   - User data embedded in posts and comments
   - Counter fields for likes, comments, shares

3. **Batch Operations**:
   - Using batch writes for atomic operations
   - Batching related updates (e.g., incrementing counters when adding comments)

4. **Query Optimization**:
   - Limiting query results
   - Using cursor-based pagination
   - Avoiding unnecessary collection scans

5. **Offline Persistence**:
   - Enabled for better offline experience
   - Network status monitoring to switch between online/offline modes

### Best Practices

- Keep documents small (< 1MB)
- Avoid deeply nested subcollections
- Use collection group queries for comments
- Implement proper pagination for large result sets
- Monitor Firestore usage in Firebase console

## Migration Strategy

The migration from mock data to Firestore is handled by `migrationService.ts`:

1. **Development Environment**:
   - `seedInitialData()`: Seeds initial mock data for development
   - Only runs once per app session

2. **Production Migration**:
   - `migrateExistingData()`: Migrates existing data to Firestore
   - Handles batching for large datasets
   - Checks for duplicates before migration

3. **Database Initialization**:
   - `initializeDatabase()`: Sets up required documents and collections
   - Creates user document if it doesn't exist

## Error Handling

Error handling is implemented in `errorService.ts`:

1. **Custom Error Types**:
   - Authentication errors
   - Network errors
   - Permission errors
   - Validation errors
   - Server errors

2. **Firebase Error Mapping**:
   - Maps Firebase error codes to user-friendly messages
   - Categorizes errors by type

3. **Error Reporting**:
   - Integration with Sentry for production error tracking
   - Conditional logging based on environment

4. **Usage Example**:
   ```javascript
   import errorService from './app/services/errorService';
   
   try {
     // Firestore operation
   } catch (error) {
     const appError = errorService.handleError(error);
     // Display user-friendly message based on appError.message
   }
   ```

## Testing

### Unit Testing

Test Firestore operations using Jest:

```javascript
// Mock Firestore for unit tests
jest.mock('../../lib/firebaseConfig', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    // ...other methods
  },
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
    }
  }
}));

test('fetchPosts should query Firestore with correct parameters', async () => {
  // Test implementation
});
```

### Integration Testing

Use Firebase Local Emulator Suite for integration testing:

1. Install and set up the emulator:
   ```bash
   firebase setup:emulators:firestore
   firebase emulators:start
   ```

2. Connect your app to the emulator:
   ```javascript
   if (process.env.NODE_ENV === 'development') {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

3. Write tests against the emulator.

## Local Development vs Production

### Local Development

1. **Firebase Emulator**:
   - Use Firebase Local Emulator Suite
   - Provides isolated environment for testing
   - No charges for Firestore operations

2. **Development Configuration**:
   - Use a separate Firebase project for development
   - Enable debug logging
   - Seed test data automatically

3. **Environment Variables**:
   - Use `.env.local` for development configuration
   - Store Firebase config for development environment

### Production

1. **Configuration**:
   - Use production Firebase project
   - Disable verbose logging
   - Enable Sentry error reporting

2. **Performance Monitoring**:
   - Enable Firebase Performance Monitoring
   - Set up alerts for slow queries

3. **Security**:
   - Ensure all security rules are properly tested
   - Implement rate limiting for expensive operations

4. **Deployment**:
   - Deploy security rules and indexes before code changes
   - Validate rules with the Firebase Rules Playground

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   - Check security rules
   - Verify user authentication
   - Ensure document ownership for protected operations

2. **Missing Indexes**:
   - Look for console warnings about missing indexes
   - Add required indexes to `firestore.indexes.json`
   - Deploy indexes with Firebase CLI

3. **Performance Issues**:
   - Check query patterns for collection scans
   - Verify proper use of pagination
   - Monitor Firestore usage in Firebase console

4. **Offline Sync Issues**:
   - Check network connectivity
   - Verify offline persistence is enabled
   - Look for conflicts in the Firestore console

### Debugging Tools

1. **Firebase Console**:
   - View and edit data directly
   - Monitor usage and performance
   - Check security rules

2. **Firebase Debug Logging**:
   ```javascript
   firebase.firestore.setLogLevel('debug');
   ```

3. **React Native Debugger**:
   - Monitor network requests
   - Inspect Firestore operations
   - View error details

---

For additional support, refer to the [Firebase Documentation](https://firebase.google.com/docs/firestore) or contact the development team.