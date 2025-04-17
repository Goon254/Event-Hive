// app/services/social/index.ts
// This file exports all social services for easier imports

// Export the main SocialService facade
export { socialService, SocialService } from './SocialService';

// Export individual services
export { postService, PostService } from './PostService';
export { commentService, CommentService } from './CommentService';
export { connectionService, ConnectionService } from './ConnectionService';
export { notificationService, NotificationService } from './NotificationService';
export { imageService, ImageService } from './ImageService';