# Firebase Storage Integration

This document outlines how Firebase Storage is integrated into the ScanGo application for handling image uploads.

## Overview

Firebase Storage is used for storing and serving user-generated content such as:
- Profile images
- Post images
- Event images
- Speaker images

The integration follows a layered architecture:
1. **Firebase Configuration** - Base setup and initialization
2. **File Utilities** - Low-level file handling functions
3. **Image Upload Service** - Domain-specific upload operations
4. **Component Hooks** - React hooks for component integration

## Firebase Configuration

Firebase Storage is initialized in `lib/firebaseConfig.tsx`:

```typescript
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Initialize Firebase app...

// Initialize storage
let storage: FirebaseStorage;
try {
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  storage = {} as FirebaseStorage;
}

// Export the initialized services
export { storage };
```

## File Utilities

Low-level file operations are handled in `app/utils/fileUtils.ts`:

- `normalizeUri(uri)` - Normalizes file URIs across platforms
- `createBlobFromUri(uri)` - Creates a blob from a file URI
- `uploadFile(uri, path, filename, onProgress)` - Uploads a single file with retry mechanism
- `uploadMultipleFiles(uris, path, onProgress, onFileProgress)` - Uploads multiple files
- `uriToDataUrl(uri)` - Converts a URI to a data URL
- `checkFileExists(uri)` - Checks if a file exists

Example usage:

```typescript
import { uploadFile } from '../utils/fileUtils';

// Upload a file with progress tracking
const downloadURL = await uploadFile(
  imageUri,
  'profile_images/user123',
  undefined,
  (progress) => console.log(`Upload progress: ${progress * 100}%`)
);
```

## Image Upload Service

Domain-specific upload operations are handled in `app/services/imageUploadService.ts`:

- `uploadProfileImage(userId, imageUri, onProgress)` - Upload profile images
- `uploadPostImage(userId, imageUri, postId, onProgress)` - Upload post images
- `uploadPostImages(userId, imageUris, postId, onProgress, onFileProgress)` - Upload multiple post images
- `uploadEventImage(userId, imageUri, eventId, onProgress)` - Upload event images
- `uploadSpeakerImage(userId, imageUri, eventId, speakerId, onProgress)` - Upload speaker images

Example usage:

```typescript
import { imageUploadService } from '../services/imageUploadService';

// Upload a profile image
const downloadURL = await imageUploadService.uploadProfileImage(
  userId,
  imageUri,
  (progress) => console.log(`Upload progress: ${progress * 100}%`)
);
```

## Component Hooks

React hooks provide a user-friendly interface for components:

- `useProfile()` - Profile operations including image uploads
- `useSocialPosts()` - Social post operations including image uploads

Example usage:

```typescript
import { useProfile } from '../hooks/useProfile';

function ProfileScreen() {
  const { uploadProfileImage, isImageUploading } = useProfile(userId);
  
  const handleImageSelect = async (imageUri) => {
    try {
      const imageUrl = await uploadProfileImage(imageUri);
      console.log('Image uploaded:', imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  // Component JSX...
}
```

## Storage Rules

Firebase Storage security rules are defined in `storage.rules`:

```
service firebase.storage {
  match /b/{bucket}/o {
    // Common helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Profile images
    match /profile_images/{userId}/{fileName} {
      // Anyone can read profile images
      allow read: if true;
      
      // Only the owner can write their profile image
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Post images
    match /posts/{userId}/{postId}/{fileName} {
      // Anyone can read post images
      allow read: if true;
      
      // Only the owner can upload post images
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Event images
    match /events/{userId}/{eventId}/{fileName} {
      // Anyone can read event images
      allow read: if true;
      
      // Only the owner can upload event images
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Speaker images for events
    match /events/{userId}/{eventId}/speakers/{speakerId}/{fileName} {
      // Anyone can read speaker images
      allow read: if true;
      
      // Only the event owner can upload speaker images
      allow write: if isSignedIn() && isOwner(userId);
    }
  }
}
```

## Testing

A test component is available at `app/screens/ImageUploadTest.tsx` to verify Firebase Storage functionality. This component allows:

- Selecting images from the device
- Uploading images to Firebase Storage
- Viewing the download URL
- Listing recent uploads
- Deleting uploaded images

## Best Practices

1. **Error Handling**: All upload operations include comprehensive error handling with retry mechanisms.
2. **Progress Tracking**: Upload progress is tracked and exposed to the UI.
3. **Path Structure**: Storage paths follow a consistent structure: `{collection}/{userId}/[{itemId}]/[{subItemId}]/{fileName}`.
4. **Security Rules**: Storage rules enforce proper authentication and authorization.
5. **Caching**: Download URLs are cached when appropriate to reduce bandwidth usage.

## Troubleshooting

Common issues and solutions:

1. **Permission Denied**: Check that the user is authenticated and has the correct permissions in the storage rules.
2. **Upload Failures**: Ensure the device has a stable internet connection and retry the upload.
3. **Large Files**: Consider compressing or resizing images before upload to improve performance.
4. **CORS Issues**: If accessing storage from a web app, ensure CORS is properly configured.

## Future Improvements

Potential enhancements to the storage integration:

1. **Image Compression**: Add automatic image compression before upload.
2. **Resumable Uploads**: Implement resumable uploads for large files.
3. **Background Uploads**: Support background uploads that continue when the app is in the background.
4. **Batch Operations**: Add support for batch operations like moving or copying files.
5. **Content Moderation**: Integrate with Cloud Functions for content moderation.

## Image Optimization

The application includes an image optimization utility (`app/utils/imageOptimizationUtils.ts`) that can be used to compress and resize images before uploading them to Firebase Storage. This helps improve upload performance and reduce storage usage.

### Features

- Image compression with configurable quality
- Image resizing with configurable dimensions
- Support for JPEG, PNG, and WebP formats
- Metadata preservation (iOS only)
- Preset quality levels (thumbnail, small, medium, large, original)
- Batch processing for multiple images

### Usage

```typescript
import { optimizeImage, optimizeImageWithPreset, ImageQuality, ImageSize } from '../utils/imageOptimizationUtils';

// Basic usage with default options (high quality, large size)
const result = await optimizeImage(imageUri);

// Using a preset
const thumbnailResult = await optimizeImageWithPreset(imageUri, 'thumbnail');

// Custom options
const customResult = await optimizeImage(imageUri, {
  quality: 0.6,
  maxWidth: 800,
  maxHeight: 600,
  format: 'webp',
  preserveMetadata: true
});

// The result includes information about the optimized image
console.log(`Original size: ${result.originalSize} bytes`);
console.log(`Optimized size: ${result.size} bytes`);
console.log(`Compression ratio: ${result.compressionRatio}`);
console.log(`Dimensions: ${result.width}x${result.height}`);
```

### Integration with File Upload

To use image optimization with the file upload utilities:

```typescript
import { uploadFile } from '../utils/fileUtils';
import { optimizeImage } from '../utils/imageOptimizationUtils';

async function uploadOptimizedImage(imageUri, path) {
  // Optimize the image first
  const optimizedResult = await optimizeImage(imageUri, {
    quality: 0.7,
    maxWidth: 1200,
    maxHeight: 1200
  });
  
  // Upload the optimized image
  const downloadURL = await uploadFile(
    optimizedResult.uri,
    path,
    undefined,
    (progress) => console.log(`Upload progress: ${progress * 100}%`)
  );
  
  return {
    downloadURL,
    width: optimizedResult.width,
    height: optimizedResult.height,
    size: optimizedResult.size,
    originalSize: optimizedResult.originalSize,
    compressionRatio: optimizedResult.compressionRatio
  };
}
```