// app/utils/imageOptimizationUtils.ts
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Image quality presets
 */
export enum ImageQuality {
  LOW = 0.3,
  MEDIUM = 0.5,
  HIGH = 0.7,
  ORIGINAL = 1.0
}

/**
 * Image size presets (max dimension in pixels)
 */
export enum ImageSize {
  THUMBNAIL = 200,
  SMALL = 500,
  MEDIUM = 1000,
  LARGE = 2000,
  ORIGINAL = 0 // No resizing
}

/**
 * Options for image optimization
 */
export interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  preserveMetadata?: boolean;
}

/**
 * Result of image optimization
 */
export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number;
  format: string;
  originalSize?: number;
  compressionRatio?: number;
}

/**
 * Optimizes an image for upload
 * @param imageUri URI of the image to optimize
 * @param options Optimization options
 * @returns Promise resolving to the optimized image result
 */
export async function optimizeImage(
  imageUri: string,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  try {
    // Default options
    const {
      quality = ImageQuality.HIGH,
      maxWidth = ImageSize.LARGE,
      maxHeight = ImageSize.LARGE,
      format = 'jpeg',
      preserveMetadata = false
    } = options;
    // Get original file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri, { size: true });
    const originalSize = fileInfo.exists ? (fileInfo as any).size || 0 : 0;

    // If the image is already small, return it as is
    if (originalSize > 0 && originalSize < 100 * 1024) { // Less than 100KB
      return {
        uri: imageUri,
        width: 0, // Unknown dimensions
        height: 0, // Unknown dimensions
        size: originalSize,
        format: imageUri.split('.').pop()?.toLowerCase() || 'unknown',
        originalSize,
        compressionRatio: 1
      };
    }

    // Prepare actions for image manipulation
    const actions: ImageManipulator.Action[] = [];

    // Add resize action if maxWidth or maxHeight is specified
    if (maxWidth > 0 || maxHeight > 0) {
      actions.push({
        resize: {
          width: maxWidth > 0 ? maxWidth : undefined,
          height: maxHeight > 0 ? maxHeight : undefined,
        },
      });
    }

    // Manipulate the image
    const manipulatorOptions: ImageManipulator.SaveOptions = {
      compress: quality,
      format: format === 'webp' 
        ? ImageManipulator.SaveFormat.WEBP 
        : format === 'png' 
          ? ImageManipulator.SaveFormat.PNG 
          : ImageManipulator.SaveFormat.JPEG,
      base64: false,
    };

    // Add metadata preservation if requested (iOS only)
    if (Platform.OS === 'ios' && preserveMetadata) {
      (manipulatorOptions as any).preserveMetadata = { exif: true };
    }

    // Process the image
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      manipulatorOptions
    );

    // Get info about the optimized file
    const optimizedFileInfo = await FileSystem.getInfoAsync(result.uri, { size: true });
    const optimizedSize = optimizedFileInfo.exists ? (optimizedFileInfo as any).size || 0 : 0;

    // Calculate compression ratio
    const compressionRatio = originalSize > 0 ? optimizedSize / originalSize : 1;

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      size: optimizedSize,
      format: format,
      originalSize,
      compressionRatio
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original image if optimization fails
    return {
      uri: imageUri,
      width: 0,
      height: 0,
      size: 0,
      format: 'unknown',
    };
  }
}

/**
 * Optimizes an image with a preset quality
 * @param imageUri URI of the image to optimize
 * @param preset Quality preset
 * @returns Promise resolving to the optimized image result
 */
export async function optimizeImageWithPreset(
  imageUri: string,
  preset: 'thumbnail' | 'small' | 'medium' | 'large' | 'original' = 'medium'
): Promise<OptimizedImageResult> {
  const options: ImageOptimizationOptions = {
    format: 'jpeg',
    preserveMetadata: false
  };

  switch (preset) {
    case 'thumbnail':
      options.quality = ImageQuality.MEDIUM;
      options.maxWidth = ImageSize.THUMBNAIL;
      options.maxHeight = ImageSize.THUMBNAIL;
      break;
    case 'small':
      options.quality = ImageQuality.HIGH;
      options.maxWidth = ImageSize.SMALL;
      options.maxHeight = ImageSize.SMALL;
      break;
    case 'medium':
      options.quality = ImageQuality.HIGH;
      options.maxWidth = ImageSize.MEDIUM;
      options.maxHeight = ImageSize.MEDIUM;
      break;
    case 'large':
      options.quality = ImageQuality.HIGH;
      options.maxWidth = ImageSize.LARGE;
      options.maxHeight = ImageSize.LARGE;
      break;
    case 'original':
      options.quality = ImageQuality.ORIGINAL;
      options.maxWidth = ImageSize.ORIGINAL;
      options.maxHeight = ImageSize.ORIGINAL;
      break;
  }

  return optimizeImage(imageUri, options);
}

/**
 * Optimizes multiple images
 * @param imageUris Array of image URIs to optimize
 * @param options Optimization options
 * @returns Promise resolving to an array of optimized image results
 */
export async function optimizeMultipleImages(
  imageUris: string[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult[]> {
  const results: OptimizedImageResult[] = [];

  for (const uri of imageUris) {
    try {
      const result = await optimizeImage(uri, options);
      results.push(result);
    } catch (error) {
      console.error(`Error optimizing image ${uri}:`, error);
      // Add the original image to the results
      results.push({
        uri,
        width: 0,
        height: 0,
        size: 0,
        format: 'unknown',
      });
    }
  }

  return results;
}

/**
 * Estimates the file size of an image based on its dimensions and quality
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @param quality Image quality (0-1)
 * @param format Image format
 * @returns Estimated file size in bytes
 */
export function estimateImageFileSize(
  width: number,
  height: number,
  quality: number = 0.7,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): number {
  const pixels = width * height;
  
  // Base bytes per pixel for different formats at quality=1.0
  const bytesPerPixel = {
    jpeg: 0.25,
    png: 0.4,
    webp: 0.15
  };
  
  // Quality factor (non-linear)
  let qualityFactor: number;
  
  if (format === 'png') {
    // PNG is lossless, so quality doesn't affect file size the same way
    qualityFactor = 1.0;
  } else {
    // For JPEG and WebP, quality has a non-linear effect on file size
    qualityFactor = Math.pow(quality, 1.5);
  }
  
  // Calculate estimated size
  const estimatedSize = pixels * bytesPerPixel[format] * qualityFactor;
  
  return Math.round(estimatedSize);
}