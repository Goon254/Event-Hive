// app/services/checkInHistoryService.ts
import { db } from '../../lib/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { toDateObject, toFirestoreTimestamp } from '../utils/dateUtils';

// Constants
const CHECK_IN_COLLECTION = 'check_ins';
const OFFLINE_CHECK_INS_KEY = 'offline_check_ins';

/**
 * Interface for check-in data
 */
export interface CheckInData {
  id?: string;
  eventId: string;
  userId: string;
  qrCodeId: string;
  timestamp: number | any;
  validatedBy: string;
  isOfflineCheckIn?: boolean;
  syncedAt?: number | any;
  metadata?: any;
}

/**
 * Service for managing check-in history
 */
export class CheckInHistoryService {
  /**
   * Record a check-in
   * @param checkInData Check-in data
   * @returns Promise resolving to success status
   */
  async recordCheckIn(checkInData: Omit<CheckInData, 'id'>): Promise<boolean> {
    try {
      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;
      
      if (isConnected) {
        // Online check-in
        return await this.recordOnlineCheckIn(checkInData);
      } else {
        // Offline check-in
        return await this.recordOfflineCheckIn(checkInData);
      }
    } catch (error) {
      console.error('Error recording check-in:', error);
      return false;
    }
  }
  
  /**
   * Record an online check-in
   * @param checkInData Check-in data
   * @returns Promise resolving to success status
   */
  private async recordOnlineCheckIn(checkInData: Omit<CheckInData, 'id'>): Promise<boolean> {
    try {
      // Check if this is a duplicate check-in
      const isDuplicate = await this.isDuplicateCheckIn(checkInData.eventId, checkInData.userId, checkInData.qrCodeId);
      if (isDuplicate) {
        console.log('Duplicate check-in detected');
        return false;
      }
      
      // Add check-in to Firestore
      const checkInsCollection = collection(db, CHECK_IN_COLLECTION);
      await addDoc(checkInsCollection, {
        ...checkInData,
        timestamp: serverTimestamp(),
        isOfflineCheckIn: false
      });
      
      return true;
    } catch (error) {
      console.error('Error recording online check-in:', error);
      return false;
    }
  }
  
  /**
   * Record an offline check-in
   * @param checkInData Check-in data
   * @returns Promise resolving to success status
   */
  private async recordOfflineCheckIn(checkInData: Omit<CheckInData, 'id'>): Promise<boolean> {
    try {
      // Check if this is a duplicate offline check-in
      const offlineCheckIns = await this.getOfflineCheckIns();
      const isDuplicate = offlineCheckIns.some(
        checkIn => 
          checkIn.eventId === checkInData.eventId && 
          checkIn.userId === checkInData.userId &&
          checkIn.qrCodeId === checkInData.qrCodeId
      );
      
      if (isDuplicate) {
        console.log('Duplicate offline check-in detected');
        return false;
      }
      
      // Add check-in to offline storage
      const newCheckIn: CheckInData = {
        ...checkInData,
        timestamp: toFirestoreTimestamp(new Date()),
        isOfflineCheckIn: true
      };
      
      offlineCheckIns.push(newCheckIn);
      await AsyncStorage.setItem(OFFLINE_CHECK_INS_KEY, JSON.stringify(offlineCheckIns));
      
      return true;
    } catch (error) {
      console.error('Error recording offline check-in:', error);
      return false;
    }
  }
  
  /**
   * Check if this is a duplicate check-in
   * @param eventId Event ID
   * @param userId User ID
   * @param qrCodeId QR code ID
   * @returns Promise resolving to whether this is a duplicate check-in
   */
  async isDuplicateCheckIn(eventId: string, userId: string, qrCodeId: string): Promise<boolean> {
    try {
      // Check Firestore for existing check-in
      const checkInsCollection = collection(db, CHECK_IN_COLLECTION);
      const q = query(
        checkInsCollection,
        where('eventId', '==', eventId),
        where('userId', '==', userId),
        where('qrCodeId', '==', qrCodeId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking for duplicate check-in:', error);
      return false; // Assume not duplicate if error
    }
  }
  
  /**
   * Get offline check-ins
   * @returns Promise resolving to offline check-ins
   */
  async getOfflineCheckIns(): Promise<CheckInData[]> {
    try {
      const offlineCheckIns = await AsyncStorage.getItem(OFFLINE_CHECK_INS_KEY);
      return offlineCheckIns ? JSON.parse(offlineCheckIns) : [];
    } catch (error) {
      console.error('Error getting offline check-ins:', error);
      return [];
    }
  }
  
  /**
   * Sync offline check-ins
   * @returns Promise resolving to success status
   */
  async syncOfflineCheckIns(): Promise<boolean> {
    try {
      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;
      
      if (!isConnected) {
        console.log('Cannot sync offline check-ins: device is offline');
        return false;
      }
      
      // Get offline check-ins
      const offlineCheckIns = await this.getOfflineCheckIns();
      
      if (offlineCheckIns.length === 0) {
        console.log('No offline check-ins to sync');
        return true;
      }
      
      // Add each check-in to Firestore
      const checkInsCollection = collection(db, CHECK_IN_COLLECTION);
      let syncedCount = 0;
      
      for (const checkIn of offlineCheckIns) {
        try {
          // Check if this is a duplicate check-in
          const isDuplicate = await this.isDuplicateCheckIn(
            checkIn.eventId,
            checkIn.userId,
            checkIn.qrCodeId
          );
          
          if (!isDuplicate) {
            await addDoc(checkInsCollection, {
              ...checkIn,
              syncedAt: serverTimestamp()
            });
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing check-in:', error);
        }
      }
      
      // Clear offline check-ins
      await AsyncStorage.setItem(OFFLINE_CHECK_INS_KEY, JSON.stringify([]));
      
      console.log(`Synced ${syncedCount} of ${offlineCheckIns.length} offline check-ins`);
      return true;
    } catch (error) {
      console.error('Error syncing offline check-ins:', error);
      return false;
    }
  }
  
  /**
   * Get check-ins for an event
   * @param eventId Event ID
   * @returns Promise resolving to check-ins
   */
  async getEventCheckIns(eventId: string): Promise<CheckInData[]> {
    try {
      // Get online check-ins
      const checkInsCollection = collection(db, CHECK_IN_COLLECTION);
      const q = query(
        checkInsCollection,
        where('eventId', '==', eventId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const checkIns: CheckInData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        checkIns.push({
          id: doc.id,
          ...data,
          timestamp: toDateObject(data.timestamp),
          syncedAt: toDateObject(data.syncedAt)
        } as CheckInData);
      });
      
      // Get offline check-ins for this event
      const offlineCheckIns = await this.getOfflineCheckIns();
      const eventOfflineCheckIns = offlineCheckIns.filter(
        checkIn => checkIn.eventId === eventId
      );
      
      // Combine online and offline check-ins
      return [...checkIns, ...eventOfflineCheckIns];
    } catch (error) {
      console.error('Error getting event check-ins:', error);
      return [];
    }
  }
  
  /**
   * Get check-ins for a user
   * @param userId User ID
   * @returns Promise resolving to check-ins
   */
  async getUserCheckIns(userId: string): Promise<CheckInData[]> {
    try {
      // Get online check-ins
      const checkInsCollection = collection(db, CHECK_IN_COLLECTION);
      const q = query(
        checkInsCollection,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const checkIns: CheckInData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        checkIns.push({
          id: doc.id,
          ...data,
          timestamp: toDateObject(data.timestamp),
          syncedAt: toDateObject(data.syncedAt)
        } as CheckInData);
      });
      
      // Get offline check-ins for this user
      const offlineCheckIns = await this.getOfflineCheckIns();
      const userOfflineCheckIns = offlineCheckIns.filter(
        checkIn => checkIn.userId === userId
      );
      
      // Combine online and offline check-ins
      return [...checkIns, ...userOfflineCheckIns];
    } catch (error) {
      console.error('Error getting user check-ins:', error);
      return [];
    }
  }
}

// Export singleton instance
export const checkInHistoryService = new CheckInHistoryService();