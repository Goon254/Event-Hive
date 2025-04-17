// app/repositories/implementations/FirebaseStorageRepository.ts
import { ref, uploadBytes, getDownloadURL, deleteObject, StorageError } from 'firebase/storage';
import { storage } from '../../../lib/firebaseConfig';

/**
 * Interface for storage upload options
 */
export interface StorageUploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Interface for upload result
 */
export interface UploadResult {
  url: string;
  path: string;
  metadata?: any;
}

/**
 * Firebase Storage Repository for handling file uploads and downloads
 * This repository provides a more robust implementation with retry logic
 * and better error handling for Firebase Storage operations
 */
export class FirebaseStorageRepository {
  /**
   * Upload a file to Firebase Storage
   * @param path Storage path
   * @param file File data (Blob, File, or base64 string)
   * @param options Upload options
   * @returns Promise resolving to the upload result
   */
  async uploadFile(
    path: string,
    file: Blob | Uint8Array | ArrayBuffer | string,
    options: StorageUploadOptions = {}
  ): Promise<UploadResult> {
    const maxRetries = options.maxRetries || 3;
    let lastError: Error | null = null;
    
    // Try uploading with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt} for path: ${path}`);
        
        // Create storage reference
        const storageRef = ref(storage, path);
        
        // Prepare upload metadata
        const metadata: any = {};
        
        if (options.contentType) {
          metadata.contentType = options.contentType;
        }
        
        if (options.customMetadata) {
          metadata.customMetadata = options.customMetadata;
        }
        
        if (options.cacheControl) {
          metadata.cacheControl = options.cacheControl;
        }
        
        // Handle base64 string (common in React Native)
        let fileData = file;
        if (typeof file === 'string' && file.startsWith('data:')) {
          // Extract base64 data from data URL
          const base64Data = file.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid base64 data URL');
          }
          
          // Convert base64 to array buffer
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          fileData = bytes;
          
          // Set content type if not provided
          if (!metadata.contentType && typeof file === 'string') {
            const match = file.match(/^data:([^;]+);/);
            if (match) {
              metadata.contentType = match[1];
            }
          }
        }
        
        // Upload file
        const snapshot = await uploadBytes(storageRef, fileData as any, metadata);
        
        // Get download URL
        const url = await getDownloadURL(snapshot.ref);
        
        return {
          url,
          path: snapshot.ref.fullPath,
          metadata: snapshot.metadata
        };
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        lastError = error as Error;
        
        // Check if we should retry
        if (attempt < maxRetries) {
          // Exponential backoff
          const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.log(`Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // If we get here, all attempts failed
    const errorMessage = lastError instanceof Error 
      ? lastError.message 
      : 'Unknown error during file upload';
      
    throw new Error(`Failed to upload file after ${maxRetries} attempts: ${errorMessage}`);
  }

  /**
   * Delete a file from Firebase Storage
   * @param path Storage path or URL
   * @returns Promise resolving when the file is deleted
   */
  async deleteFile(path: string): Promise<void> {
    try {
      // If path is a URL, extract the path part
      if (path.includes('firebasestorage.googleapis.com')) {
        const pathPart = path.split('/o/')[1];
        if (pathPart) {
          path = decodeURIComponent(pathPart.split('?')[0]);
        } else {
          throw new Error('Invalid Firebase Storage URL');
        }
      }
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      // Handle specific Firebase Storage errors
      if (error && typeof error === 'object' && 'code' in error) {
        const storageError = error as StorageError;
        
        if (storageError.code === 'storage/object-not-found') {
          console.warn(`File not found in storage: ${path}`);
          // Don't throw for non-existent files
          return;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get the download URL for a file
   * @param path Storage path
   * @returns Promise resolving to the download URL
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists in Firebase Storage
   * @param path Storage path
   * @returns Promise resolving to true if the file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, path);
      await getDownloadURL(storageRef);
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const storageError = error as StorageError;
        
        if (storageError.code === 'storage/object-not-found') {
          return false;
        }
      }
      
      throw error;
    }
  }
}

// Export a singleton instance
export const firebaseStorageRepository = new FirebaseStorageRepository();

// Add default export
export default FirebaseStorageRepository;