// app/hooks/useSocialPosts.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../AuthContext';
import { socialService } from '../services/social/SocialService';
import { imageService } from '../services/social/ImageService';
import { ImageQuality, ImageSize } from '../services/enhancedImageService';
import { ContentType, PrivacyLevel } from '../models/social';
import { Timestamp } from 'firebase/firestore';

/**
 * Custom hook for social post operations
 * @returns Social post functions and state
 */
export function useSocialPosts() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Create a new post with optional media
   * @param content Post text content
   * @param mediaFiles Array of media file URIs
   * @param privacyLevel Privacy level for the post
   * @returns Promise resolving to the created post
   */
  const createPost = useCallback(async (
    content: string,
    mediaFiles: string[] = [],
    privacyLevel: PrivacyLevel = PrivacyLevel.PUBLIC
  ) => {
    if (!user || !user.id) {
      throw new Error('User must be logged in to create posts');
    }
    
    try {
      setIsLoading(true);
      setIsUploading(mediaFiles.length > 0);
      setError(null);
      setUploadProgress(0);
      
      // Prepare post data
      const postData = {
        userId: user.id,
        userName: user.name || 'Anonymous',
        userAvatar: user.avatar,
        content: content.trim(),
        contentType: mediaFiles.length > 0 ? ContentType.MIXED : ContentType.TEXT,
        privacyLevel,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: Timestamp.now() // Add createdAt field
      };
      
      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        try {
          // Configure upload options
          const uploadOptions = {
            quality: ImageQuality.HIGH,
            maxWidth: ImageSize.LARGE,
            maxHeight: ImageSize.LARGE,
            compress: true,
            generateThumbnail: true,
            thumbnailSize: 300,
            metadata: {
              userId: user.id,
              contentType: ContentType.MIXED,
              privacyLevel,
              uploadedAt: new Date().toISOString()
            },
            onProgress: (progress: number) => {
              // Update overall progress
              setUploadProgress(progress);
            }
          };
          
          // Upload each image using the new image service
          const uploadPromises = mediaFiles.map(uri =>
            imageService.uploadPostImage(uri, undefined, uploadOptions)
          );
          
          // Wait for all uploads to complete
          const results = await Promise.allSettled(uploadPromises);
          
          // Process results
          const successfulUploads = results
            .filter((result): result is PromiseFulfilledResult<{url: string, thumbnailUrl?: string}> =>
              result.status === 'fulfilled'
            )
            .map(result => result.value.url);
          
          // Get successful uploads
          mediaUrls = successfulUploads;
          
          // Handle any errors
          const failedUploads = results.filter(result => result.status === 'rejected').length;
          if (failedUploads > 0) {
            console.warn(`${failedUploads} images failed to upload`);
            
            // If all uploads failed, throw an error
            if (mediaUrls.length === 0) {
              throw new Error('Failed to upload any images. Please try again.');
            }
          }
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          
          // Ask user if they want to continue without images
          const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Image Upload Failed',
              'Would you like to continue creating the post without images?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false)
                },
                {
                  text: 'Continue Without Images',
                  onPress: () => resolve(true)
                }
              ]
            );
          });
          
          if (!shouldContinue) {
            throw new Error('Post creation canceled');
          }
          
          // Continue with empty media URLs
          mediaUrls = [];
        }
      }
      
      // Create the post with the media URLs
      const newPost = await socialService.posts.createPost(postData, mediaUrls);
      return newPost;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create post');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  }, [user]);
  
  /**
   * Delete a post
   * @param postId Post ID to delete
   * @returns Promise resolving when the post is deleted
   */
  const deletePost = useCallback(async (postId: string) => {
    if (!user || !user.id) {
      throw new Error('User must be logged in to delete posts');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await socialService.posts.deletePost(postId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete post');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  return {
    isLoading,
    isUploading,
    uploadProgress,
    error,
    createPost,
    deletePost
  };
}