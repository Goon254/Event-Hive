// app/utils/fileUtils.ts
import { Platform } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL, StorageError } from 'firebase/storage';

/**
 * Maximum number of retry attempts for uploads
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay between retry attempts (in ms)
 */
const RETRY_DELAY = 1000;

/**
 * Normalizes a file URI to ensure compatibility across platforms
 * @param uri The original URI from image picker or camera
 * @returns Normalized URI that works with fetch
 */
export const normalizeUri = (uri: string | null): string => {
  if (!uri) return '';
  
  // Handle different URI formats based on platform
  if (Platform.OS === 'ios') {
    // On iOS, ensure the URI has the file:// prefix for local files
    if (uri.startsWith('file://')) {
      return uri;
    } else if (!uri.startsWith('http') && !uri.startsWith('data:')) {
      // Add file:// prefix if it's missing and not a remote URL or data URI
      return `file://${uri}`;
    }
  } else if (Platform.OS === 'android') {
    // On Android, file:// is usually not needed, but let's ensure it's properly formatted
    if (uri.startsWith('content://') || uri.startsWith('/') || uri.startsWith('file:')) {
      return uri;
    }
  }
  
  // Return as is for web or if already properly formatted
  return uri;
};

/**
 * Creates a blob from a file URI with improved error handling
 * @param uri Normalized file URI
 * @returns Promise resolving to a Blob
 */
export const createBlobFromUri = async (uri: string): Promise<Blob> => {
  try {
    // For data URIs, convert directly to blob without fetch
    if (uri.startsWith('data:')) {
      return await (await fetch(uri)).blob();
    }
    
    // Standard fetch approach for file URIs and remote URLs
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Verify blob was created successfully
    if (!blob || blob.size === 0) {
      throw new Error('Created blob is empty or invalid');
    }
    
    return blob;
  } catch (error) {
    console.error('Error creating blob:', error);
    throw new Error(`Failed to create blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Uploads a file to Firebase Storage with retry mechanism and progress tracking
 * @param uri Local file URI
 * @param path Storage path (folder)
 * @param filename Optional custom filename
 * @param onProgress Optional callback for upload progress updates
 * @returns Download URL of the uploaded file
 */
export const uploadFile = async (
  uri: string, 
  path: string = 'uploads',
  filename?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  let attemptCount = 0;
  
  const attemptUpload = async (): Promise<string> => {
    try {
      attemptCount++;
      
      if (!uri) {
        console.warn('No URI provided for upload');
        return '';
      }
      
      // Normalize the URI for platform compatibility
      const normalizedUri = normalizeUri(uri);
      
      // If still no valid URI after normalization, return empty
      if (!normalizedUri) {
        return '';
      }
      
      // Get filename from URI if not provided
      const name = filename || normalizedUri.substring(normalizedUri.lastIndexOf('/') + 1);
      
      // Create a unique filename with timestamp and random string to avoid collisions
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${name}`;
      
      // Initialize storage and create reference
      const storage = getStorage();
      const fileRef = ref(storage, `${path}/${uniqueFilename}`);
      
      // Create blob with improved error handling
      const blob = await createBlobFromUri(normalizedUri);
      
      // Upload blob to Firebase Storage
      // Note: Firebase Storage JS SDK doesn't support progress updates directly
      // We would need to use XMLHttpRequest for progress, but for simplicity we'll simulate it
      
      // Simulate progress updates if callback provided
      if (onProgress) {
        // Simulate progress before actual upload starts
        onProgress(0.1);
        
        // Set up a progress simulator
        let simulatedProgress = 0.1;
        const progressInterval = setInterval(() => {
          if (simulatedProgress < 0.9) {
            simulatedProgress += 0.1;
            onProgress(simulatedProgress);
          } else {
            clearInterval(progressInterval);
          }
        }, 500);
        
        // Clear interval if upload completes or fails
        try {
          const uploadResult = await uploadBytes(fileRef, blob);
          clearInterval(progressInterval);
          onProgress(1.0); // Final progress
          console.log('File uploaded successfully', uploadResult.metadata.fullPath);
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } else {
        // Standard upload without progress tracking
        const uploadResult = await uploadBytes(fileRef, blob);
        console.log('File uploaded successfully', uploadResult.metadata.fullPath);
      }
      
      // Get download URL
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error(`Upload attempt ${attemptCount} failed:`, error);
      
      // Check if we should retry
      if (attemptCount < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying upload in ${RETRY_DELAY/1000} seconds...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Try again
        return attemptUpload();
      }
      
      // If we've exhausted retry attempts, throw the error
      console.error(`All ${MAX_RETRY_ATTEMPTS} upload attempts failed`);
      throw error;
    }
  };
  
  try {
    return await attemptUpload();
  } catch (error) {
    console.error('Error uploading file after all retries:', error);
    // Return empty string instead of throwing to allow graceful fallbacks
    return '';
  }
};

/**
 * Uploads multiple files to Firebase Storage with better error handling and progress tracking
 * @param uris Array of local file URIs
 * @param path Storage path (folder)
 * @param onProgress Optional callback for overall progress updates
 * @param onFileProgress Optional callback for individual file progress updates
 * @returns Array of download URLs for successfully uploaded files
 */
export const uploadMultipleFiles = async (
  uris: string[], 
  path: string = 'uploads',
  onProgress?: (overall: number) => void,
  onFileProgress?: (index: number, progress: number) => void
): Promise<string[]> => {
  try {
    if (!uris || uris.length === 0) {
      return [];
    }
    
    const totalFiles = uris.length;
    let completedFiles = 0;
    
    // Use sequential uploads with progress tracking
    const downloadUrls: string[] = [];
    
    for (let i = 0; i < uris.length; i++) {
      try {
        // Upload each file with individual progress tracking
        const fileProgress = (progress: number) => {
          if (onFileProgress) {
            onFileProgress(i, progress);
          }
          
          // Calculate overall progress
          if (onProgress) {
            const overallProgress = (completedFiles + progress) / totalFiles;
            onProgress(overallProgress);
          }
        };
        
        const url = await uploadFile(uris[i], path, undefined, fileProgress);
        
        if (url) {
          downloadUrls.push(url);
        }
        
        completedFiles++;
        
        // Update overall progress after each file completes
        if (onProgress) {
          onProgress(completedFiles / totalFiles);
        }
      } catch (error) {
        console.error(`Error uploading file ${i}:`, error);
        // Continue with next file instead of failing the whole batch
      }
    }
    
    // Log failed uploads
    const failedCount = uris.length - downloadUrls.length;
    if (failedCount > 0) {
      console.warn(`${failedCount} of ${uris.length} files failed to upload`);
    }
    
    return downloadUrls;
  } catch (error) {
    console.error('Error in bulk file upload:', error);
    return [];
  }
};

/**
 * Generates a data URL from a local file URI with improved error handling
 * @param uri Local file URI
 * @returns Promise resolving to data URL
 */
export const uriToDataUrl = async (uri: string): Promise<string> => {
  try {
    const normalizedUri = normalizeUri(uri);
    if (!normalizedUri) return '';
    
    // For data URIs, return directly
    if (normalizedUri.startsWith('data:')) {
      return normalizedUri;
    }
    
    const response = await fetch(normalizedUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URI to data URL:', error);
    return '';
  }
};

/**
 * Checks if a file exists and is accessible
 * @param uri File URI to check
 * @returns Promise resolving to boolean indicating if file exists and is accessible
 */
export const checkFileExists = async (uri: string): Promise<boolean> => {
  try {
    const normalizedUri = normalizeUri(uri);
    if (!normalizedUri) return false;
    
    // For web URLs, just check if they respond
    if (normalizedUri.startsWith('http')) {
      const response = await fetch(normalizedUri, { method: 'HEAD' });
      return response.ok;
    }
    
    // For local files, try to read file metadata
    const response = await fetch(normalizedUri);
    return response.ok;
  } catch (error) {
    console.warn('Error checking if file exists:', error);
    return false;
  }
};