// app/utils/fileUtils.ts
import { Platform } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Normalizes a file URI to ensure compatibility across platforms
 * @param uri The original URI from image picker or camera
 * @returns Normalized URI that works with fetch
 */
export const normalizeUri = (uri: string | null): string => {
  if (!uri) return '';
  
  // On iOS, we need to handle file:// protocol for local files
  if (Platform.OS === 'ios' && uri.startsWith('file://')) {
    return uri;
  } else if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('http')) {
    // Add file:// prefix if it's missing and not a remote URL
    return `file://${uri}`;
  }
  
  // Return as is for Android and web
  return uri;
};

/**
 * Uploads a file to Firebase Storage
 * @param uri Local file URI
 * @param path Storage path (folder)
 * @param filename Optional custom filename
 * @returns Download URL of the uploaded file
 */
export const uploadFile = async (
  uri: string, 
  path: string = 'uploads',
  filename?: string
): Promise<string> => {
  try {
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
    
    // Create a unique filename with timestamp
    const uniqueFilename = `${Date.now()}_${name}`;
    
    // Initialize storage and create reference
    const storage = getStorage();
    const fileRef = ref(storage, `${path}/${uniqueFilename}`);
    
    // Fetch the file as a blob
    const response = await fetch(normalizedUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Upload blob to Firebase Storage
    const uploadResult = await uploadBytes(fileRef, blob);
    console.log('File uploaded successfully', uploadResult.metadata.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    // Return empty string instead of throwing to allow graceful fallbacks
    return '';
  }
};

/**
 * Uploads multiple files to Firebase Storage
 * @param uris Array of local file URIs
 * @param path Storage path (folder)
 * @returns Array of download URLs for successfully uploaded files
 */
export const uploadMultipleFiles = async (
  uris: string[], 
  path: string = 'uploads'
): Promise<string[]> => {
  try {
    if (!uris || uris.length === 0) {
      return [];
    }
    
    // Use Promise.allSettled to handle partial failures
    const uploadPromises = uris.map(uri => uploadFile(uri, path));
    const results = await Promise.allSettled(uploadPromises);
    
    // Extract successful uploads
    const downloadUrls = results
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && !!result.value
      )
      .map(result => result.value);
    
    // Log failed uploads
    const failedCount = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value)
    ).length;
    
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
 * Generates a data URL from a local file URI (useful for previews)
 * @param uri Local file URI
 * @returns Promise resolving to data URL
 */
export const uriToDataUrl = async (uri: string): Promise<string> => {
  try {
    const normalizedUri = normalizeUri(uri);
    if (!normalizedUri) return '';
    
    const response = await fetch(normalizedUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URI to data URL:', error);
    return '';
  }
};