# Enhanced Image Handling System

This document provides an overview of the enhanced image handling system implemented in the ScanGo application. The system provides a robust, consistent, and maintainable approach to image operations throughout the application.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Usage Guide](#usage-guide)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Overview

The enhanced image handling system provides a unified approach to image operations, including selection, processing, uploading, and display. It addresses several issues with the previous implementation:

- Inconsistent path structures for different image types
- Lack of image optimization and validation
- Inconsistent error handling
- Duplicate code across components
- Limited progress tracking and user feedback

The new system provides a clean, consistent API for all image operations, with built-in optimization, validation, and error handling.

## Key Features

- **Unified API**: Consistent interface for all image operations
- **Image Optimization**: Automatic resizing and compression based on image type
- **Thumbnail Generation**: Automatic thumbnail creation for faster loading
- **Robust Error Handling**: Comprehensive error handling and user feedback
- **Progress Tracking**: Real-time upload progress tracking
- **Type Safety**: Full TypeScript support with clear interfaces
- **Configurable Options**: Customizable options for different use cases
- **Consistent Storage Paths**: Standardized path structure for Firebase Storage

## Architecture

The enhanced image handling system consists of three main components:

1. **EnhancedImageService**: Core service that handles image operations
2. **useImageUpload Hook**: React hook for easy integration with components
3. **Storage Rules**: Firebase Storage rules that secure the uploaded images

### EnhancedImageService

The `EnhancedImageService` provides low-level functions for image operations:

- Image selection from gallery or camera
- Image processing (resizing, compression)
- Thumbnail generation
- Upload to Firebase Storage
- Error handling and retry logic

### useImageUpload Hook

The `useImageUpload` hook provides a React-friendly interface for components:

- State management for image operations
- User-friendly error handling
- Progress tracking
- Simplified API for common operations

### Storage Rules

The Firebase Storage rules secure the uploaded images:

- Path-based access control
- User authentication validation
- Owner-only write permissions
- Public read access for shared resources

## Usage Guide

### Basic Usage

```tsx
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageType } from '../services/enhancedImageService';

function MyComponent() {
  const {
    imageUri,
    uploadedUrl,
    isUploading,
    uploadProgress,
    error,
    pickImage,
    uploadImage,
  } = useImageUpload();

  const handleSelectImage = async () => {
    await pickImage();
  };

  const handleUpload = async () => {
    if (imageUri) {
      await uploadImage(ImageType.PROFILE);
    }
  };

  return (
    <View>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Button title="Select Image" onPress={handleSelectImage} />
      <Button 
        title="Upload" 
        onPress={handleUpload} 
        disabled={!imageUri || isUploading} 
      />
      {isUploading && (
        <View>
          <Progress value={uploadProgress} />
          <Text>{Math.round(uploadProgress * 100)}%</Text>
        </View>
      )}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {uploadedUrl && <Image source={{ uri: uploadedUrl }} style={styles.uploadedImage} />}
    </View>
  );
}
```

### Advanced Usage

For more advanced use cases, you can customize the upload options:

```tsx
const handleUpload = async () => {
  if (imageUri) {
    await uploadImage(
      ImageType.EVENT,
      {
        quality: ImageQuality.HIGH,
        maxWidth: ImageSize.LARGE,
        maxHeight: ImageSize.LARGE,
        compress: true,
        generateThumbnail: true,
        thumbnailSize: 300,
        metadata: {
          eventId: '123',
          category: 'conference',
        },
      },
      'event-123' // Optional ID for the path
    );
  }
};
```

### Demo Component

The `EnhancedImageUploadDemo` component provides a complete example of how to use the enhanced image handling system. It demonstrates:

- Image selection from gallery or camera
- Configuration of upload options
- Upload with different image types
- Progress tracking
- Error handling
- Display of uploaded images and thumbnails

## Best Practices

1. **Always Use the Hook**: Use the `useImageUpload` hook for all image operations to ensure consistency.

2. **Handle Errors**: Always handle errors from image operations to provide a good user experience.

3. **Show Progress**: Display upload progress for large images to keep users informed.

4. **Optimize Images**: Use appropriate quality and size settings for different image types.

5. **Use Thumbnails**: Enable thumbnail generation for images that will be displayed in lists or grids.

6. **Clean Up**: Reset the image state when the component unmounts to prevent memory leaks.

7. **Validate Inputs**: Validate image URIs and options before uploading to prevent errors.

8. **Use Appropriate Types**: Use the correct `ImageType` for different use cases to ensure proper path structure and options.

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the user has granted permission to access the camera and photo library.

2. **Upload Failures**: Check network connectivity and Firebase Storage rules.

3. **Image Processing Errors**: Ensure the image URI is valid and the image is not corrupted.

4. **Missing Thumbnails**: Verify that `generateThumbnail` is enabled in the upload options.

5. **Slow Uploads**: Large images may take time to upload. Use appropriate quality and size settings.

### Error Codes

The system provides detailed error messages for common issues:

- `storage/unauthorized`: The user does not have permission to upload to the specified path.
- `storage/quota-exceeded`: The Firebase Storage quota has been exceeded.
- `storage/canceled`: The upload was canceled by the user or the system.
- `storage/unknown`: An unknown error occurred during upload.

### Debugging

For debugging issues, check the console logs for detailed error information. The system logs:

- Image selection and processing steps
- Upload progress and status
- Detailed error information for failures
- Firebase Storage paths and references

## Migration Guide

To migrate from the old image handling system to the enhanced system:

1. Use `enhancedImageService` for all image operations
2. Use the `useImageUpload` hook for component integration
3. Update path structures to match the new standardized paths
4. Add error handling and progress tracking

Example migration:

**Before:**
```tsx
import { enhancedImageService, ImageType } from '../services/enhancedImageService';

const uploadProfileImage = async (imageUri) => {
  try {
    const result = await enhancedImageService.uploadProfileImage(imageUri);
    setProfileImageUrl(result.url);
  } catch (error) {
    console.error('Error uploading profile image:', error);
  }
};
```

**After:**
```tsx
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageType } from '../services/enhancedImageService';

function MyComponent() {
  const {
    imageUri,
    uploadedUrl,
    isUploading,
    error,
    pickImage,
    uploadImage,
  } = useImageUpload();

  const handleSelectAndUploadImage = async () => {
    const uri = await pickImage();
    if (uri) {
      await uploadImage(ImageType.PROFILE);
      if (uploadedUrl) {
        setProfileImageUrl(uploadedUrl);
      }
    }
  };
}