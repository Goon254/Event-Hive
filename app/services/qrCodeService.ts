// app/services/qrCodeService.ts
import { encryptionService } from './encryptionService';
import { checkInHistoryService } from './checkInHistoryService';
import * as Crypto from 'expo-crypto';
import { db } from '../../lib/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { toDateObject, isValidDate, toFirestoreTimestamp } from '../utils/dateUtils';

// Constants
const QR_CODE_COLLECTION = 'qr_codes';
const QR_CODE_CACHE_PREFIX = 'qr_code_cache_';
const QR_CODE_VALIDATION_CACHE = 'qr_code_validation_cache';

/**
 * Interface for QR code data
 */
export interface QRCodeData {
  id: string;           // Unique identifier for this QR code
  eventId: string;      // Event ID
  userId: string;       // User ID
  timestamp: number;    // Creation timestamp
  expiresAt?: number;   // Optional expiration timestamp
  metadata?: any;       // Optional additional metadata
}

/**
 * Interface for QR code document in Firestore
 */
interface QRCodeDocument {
  id: string;
  eventId: string;
  userId: string;
  timestamp: any;
  expiresAt?: any;
  metadata?: any;
  isCheckedIn: boolean;
  checkedInAt?: any;
  checkedInBy?: string;
  validationCount: number;
  lastValidatedAt?: any;
}

/**
 * Interface for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  message: string;
  data?: QRCodeData;
  isOfflineValidation?: boolean;
}

/**
 * Service for QR code generation, encryption, and validation
 */
export class QRCodeService {
  /**
   * Generate a unique QR code for an event and user
   * @param eventId Event ID
   * @param userId User ID
   * @param metadata Optional additional metadata
   * @param expiresInHours Optional expiration time in hours
   * @returns Promise resolving to QR code data and URI
   */
  async generateQRCode(
    eventId: string,
    userId: string,
    metadata?: any,
    expiresInHours?: number
  ): Promise<{ data: QRCodeData; uri: string }> {
    try {
      // Generate a unique ID for this QR code
      const uniqueId = await Crypto.randomUUID();
      
      // Create QR code data
      const timestamp = new Date().getTime();
      const expiresAt = expiresInHours ? timestamp + expiresInHours * 60 * 60 * 1000 : undefined;
      
      const qrData: QRCodeData = {
        id: uniqueId,
        eventId,
        userId,
        timestamp,
        expiresAt,
        metadata
      };
      
      // Store QR code data in Firestore
      await this.storeQRCodeData(qrData);
      
      // Cache QR code data locally
      await this.cacheQRCodeData(qrData);
      
      // Generate QR code URI with encrypted data
      const uri = await this.generateQRCodeURI(qrData);
      
      return { data: qrData, uri };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }
  
  /**
   * Store QR code data in Firestore
   * @param qrData QR code data
   */
  private async storeQRCodeData(qrData: QRCodeData): Promise<void> {
    try {
      const qrCodeDoc: QRCodeDocument = {
        id: qrData.id,
        eventId: qrData.eventId,
        userId: qrData.userId,
        timestamp: toFirestoreTimestamp(qrData.timestamp),
        expiresAt: qrData.expiresAt ? toFirestoreTimestamp(qrData.expiresAt) : null,
        metadata: qrData.metadata || null,
        isCheckedIn: false,
        validationCount: 0
      };
      
      const docRef = doc(db, QR_CODE_COLLECTION, qrData.id);
      await setDoc(docRef, qrCodeDoc);
      
      console.log('QR code data stored in Firestore:', qrData.id);
    } catch (error) {
      console.error('Error storing QR code data:', error);
      throw error;
    }
  }
  
  /**
   * Cache QR code data locally
   * @param qrData QR code data
   */
  private async cacheQRCodeData(qrData: QRCodeData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${QR_CODE_CACHE_PREFIX}${qrData.id}`,
        JSON.stringify(qrData)
      );
    } catch (error) {
      console.error('Error caching QR code data:', error);
      // Non-critical error, can continue
    }
  }
  
  /**
   * Generate QR code URI with encrypted data
   * @param qrData QR code data
   * @returns Promise resolving to QR code URI
   */
  private async generateQRCodeURI(qrData: QRCodeData): Promise<string> {
    // Convert data to string
    const dataString = JSON.stringify(qrData);
    
    // In a production app, we would encrypt this data
    // For now, we'll use a simple encoding scheme
    const encodedData = btoa(dataString);
    
    // Format: scangoapp://event-checkin/[encoded data]
    return `scangoapp://event-checkin/${encodedData}`;
  }
  
  /**
   * Validate a QR code
   * @param qrCodeURI QR code URI
   * @param validatorId ID of the person validating the QR code
   * @returns Promise resolving to validation result
   */
  async validateQRCode(qrCodeURI: string, validatorId: string): Promise<ValidationResult> {
    try {
      // Check if the QR code is in the correct format
      if (!qrCodeURI.startsWith('scangoapp://event-checkin/')) {
        return {
          isValid: false,
          message: 'Invalid QR code format'
        };
      }
      
      // Extract encoded data
      const encodedData = qrCodeURI.replace('scangoapp://event-checkin/', '');
      
      // Decode data
      let qrData: QRCodeData;
      try {
        const dataString = atob(encodedData);
        qrData = JSON.parse(dataString);
      } catch (error) {
        return {
          isValid: false,
          message: 'QR code data is corrupted'
        };
      }
      
      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;
      
      if (isConnected) {
        // Online validation
        return this.validateQRCodeOnline(qrData, validatorId);
      } else {
        // Offline validation
        return this.validateQRCodeOffline(qrData, validatorId);
      }
    } catch (error) {
      console.error('Error validating QR code:', error);
      return {
        isValid: false,
        message: 'An error occurred during validation'
      };
    }
  }
  
  /**
   * Validate QR code online against Firestore
   * @param qrData QR code data
   * @param validatorId ID of the person validating the QR code
   * @returns Promise resolving to validation result
   */
  private async validateQRCodeOnline(qrData: QRCodeData, validatorId: string): Promise<ValidationResult> {
    try {
      // Get QR code document from Firestore
      const docRef = doc(db, QR_CODE_COLLECTION, qrData.id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          isValid: false,
          message: 'QR code not found'
        };
      }
      
      const qrCodeDoc = docSnap.data() as QRCodeDocument;
      
      // Check if QR code is already checked in
      if (qrCodeDoc.isCheckedIn) {
        return {
          isValid: false,
          message: 'QR code has already been used for check-in',
          data: qrData
        };
      }
      
      // Check if QR code is expired
      if (qrCodeDoc.expiresAt) {
        const expiryDate = toDateObject(qrCodeDoc.expiresAt);
        if (expiryDate && expiryDate < new Date()) {
        return {
          isValid: false,
          message: 'QR code has expired',
          data: qrData
        };
        }
      }
      
      // Update QR code document
      await updateDoc(docRef, {
        isCheckedIn: true,
        checkedInAt: serverTimestamp(),
        checkedInBy: validatorId,
        validationCount: qrCodeDoc.validationCount + 1,
        lastValidatedAt: serverTimestamp()
      });
      
      // Record check-in in history
      const checkInRecorded = await checkInHistoryService.recordCheckIn({
        eventId: qrData.eventId,
        userId: qrData.userId,
        qrCodeId: qrData.id,
        timestamp: new Date().getTime(),
        validatedBy: validatorId,
        metadata: qrData.metadata
      });
      
      if (!checkInRecorded) {
        return {
          isValid: false,
          message: 'This QR code has already been used for check-in',
          data: qrData
        };
      }
      
      // Cache validation result for offline use
      await this.cacheValidationResult(qrData.id, true);
      
      return {
        isValid: true,
        message: 'QR code validated successfully',
        data: qrData
      };
    } catch (error) {
      console.error('Error validating QR code online:', error);
      return {
        isValid: false,
        message: 'An error occurred during online validation'
      };
    }
  }
  
  /**
   * Validate QR code offline using cached data
   * @param qrData QR code data
   * @param validatorId ID of the person validating the QR code
   * @returns Promise resolving to validation result
   */
  private async validateQRCodeOffline(qrData: QRCodeData, validatorId: string): Promise<ValidationResult> {
    try {
      // Check if QR code is in validation cache
      const validationCache = await this.getValidationCache();
      
      if (validationCache[qrData.id]) {
        return {
          isValid: false,
          message: 'QR code has already been used for check-in (offline)',
          data: qrData,
          isOfflineValidation: true
        };
      }
      
      // Check if QR code is expired
      if (qrData.expiresAt) {
        const expiryDate = new Date(qrData.expiresAt);
        if (isValidDate(expiryDate) && expiryDate < new Date()) {
        return {
          isValid: false,
          message: 'QR code has expired (offline)',
          data: qrData,
          isOfflineValidation: true
        };
        }
      }
      
      // Record offline check-in
      const checkInRecorded = await checkInHistoryService.recordCheckIn({
        eventId: qrData.eventId,
        userId: qrData.userId,
        qrCodeId: qrData.id,
        timestamp: new Date().getTime(),
        validatedBy: validatorId,
        isOfflineCheckIn: true,
        metadata: qrData.metadata
      });
      
      if (!checkInRecorded) {
        return {
          isValid: false,
          message: 'This QR code has already been used for check-in (offline)',
          data: qrData,
          isOfflineValidation: true
        };
      }
      
      // Add to validation cache
      await this.cacheValidationResult(qrData.id, true);
      
      return {
        isValid: true,
        message: 'QR code validated successfully (offline)',
        data: qrData,
        isOfflineValidation: true
      };
    } catch (error) {
      console.error('Error validating QR code offline:', error);
      return {
        isValid: false,
        message: 'An error occurred during offline validation',
        isOfflineValidation: true
      };
    }
  }
  
  /**
   * Get validation cache
   * @returns Promise resolving to validation cache
   */
  private async getValidationCache(): Promise<Record<string, boolean>> {
    try {
      const cache = await AsyncStorage.getItem(QR_CODE_VALIDATION_CACHE);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.error('Error getting validation cache:', error);
      return {};
    }
  }
  
  /**
   * Cache validation result
   * @param qrCodeId QR code ID
   * @param isValidated Whether the QR code was validated
   */
  private async cacheValidationResult(qrCodeId: string, isValidated: boolean): Promise<void> {
    try {
      const cache = await this.getValidationCache();
      cache[qrCodeId] = isValidated;
      await AsyncStorage.setItem(QR_CODE_VALIDATION_CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching validation result:', error);
    }
  }
  
  /**
   * Queue offline validation for sync when online
   * @param qrCodeId QR code ID
   * @param validatorId ID of the person validating the QR code
   */
  private async queueOfflineValidation(qrCodeId: string, validatorId: string): Promise<void> {
    // In a real implementation, we would queue this for sync when online
    // For now, we'll just log it
    console.log('Queued offline validation for sync:', qrCodeId, validatorId);
  }
  /**
   * Sync offline validations when online
   */
  async syncOfflineValidations(): Promise<void> {
    try {
      // Sync offline check-ins
      await checkInHistoryService.syncOfflineCheckIns();
      
      console.log('Synced offline validations');
    } catch (error) {
      console.error('Error syncing offline validations:', error);
    }
  }
}

// Export singleton instance
export const qrCodeService = new QRCodeService();