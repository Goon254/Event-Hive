# Social Services Architecture

This directory contains the implementation of the social features for the ScanGo application, following a clean architecture approach with a repository pattern.

## Architecture Overview

The social services are organized into the following layers:

1. **Repository Interfaces**: Define the contracts for data access operations
2. **Repository Implementations**: Implement the repository interfaces using Firebase
3. **Service Layer**: Provide business logic and use the repositories
4. **Facade**: A unified entry point for all social functionality

### Directory Structure

```
app/
├── repositories/
│   ├── interfaces/             # Repository interfaces
│   │   ├── IRepository.ts      # Base repository interface
│   │   ├── IPostRepository.ts
│   │   ├── ICommentRepository.ts
│   │   ├── IConnectionRepository.ts
│   │   └── INotificationRepository.ts
│   ├── implementations/        # Repository implementations
│   │   ├── FirebaseRepository.ts  # Base Firebase repository
│   │   ├── FirebasePostRepository.ts
│   │   ├── FirebaseCommentRepository.ts
│   │   ├── FirebaseConnectionRepository.ts
│   │   └── FirebaseNotificationRepository.ts
│   └── RepositoryFactory.ts    # Factory for getting repository instances
├── services/
│   └── social/                 # Social services
│       ├── PostService.ts      # Post-related operations
│       ├── CommentService.ts   # Comment-related operations
│       ├── ConnectionService.ts # Connection-related operations
│       ├── NotificationService.ts # Notification-related operations
│       ├── SocialService.ts    # Main facade for all social services
│       └── index.ts            # Exports all services
```

## Usage

### Importing

```typescript
// Import the main facade
import { socialService } from '../services/social';

// Or import individual services if needed
import { postService, commentService } from '../services/social';
```

### Examples

#### Creating a Post

```typescript
// Create a post
const post = await socialService.posts.createPost({
  content: 'Hello, world!',
  contentType: ContentType.TEXT,
  privacyLevel: PrivacyLevel.PUBLIC,
  createdAt: Timestamp.now()
});
```

#### Getting Comments for a Post

```typescript
// Get comments for a post
const comments = await socialService.comments.getPostComments(postId);
```

#### Setting up a Real-time Listener

```typescript
// Set up a real-time listener for posts
const unsubscribe = socialService.posts.setupPostsListener(
  (posts) => {
    // Update UI with new posts
    console.log('New posts:', posts);
  },
  { limit: 10 }
);

// Later, when no longer needed
unsubscribe();
```

#### User Connections

```typescript
// Send a connection request
await socialService.connections.sendConnectionRequest(userId);

// Accept a connection request
await socialService.connections.acceptConnectionRequest(userId);

// Get user connections
const connections = await socialService.connections.getUserConnections();
```

#### Notifications

```typescript
// Get notifications
const notifications = await socialService.notifications.getNotifications();

// Mark a notification as read
await socialService.notifications.markNotificationAsRead(notificationId);

// Mark all notifications as read
await socialService.notifications.markAllNotificationsAsRead();
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each component has a single responsibility
2. **Testability**: Easy to mock repositories for testing services
3. **Maintainability**: Changes to one part don't affect others
4. **Flexibility**: Easy to swap implementations (e.g., switch from Firebase to another backend)
5. **Scalability**: New features can be added without modifying existing code