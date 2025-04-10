// app/services/contactSyncService.ts
import { useState, useEffect, useCallback } from 'react';
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { Platform, PermissionsAndroid } from 'react-native';
import { ContactMatch } from '../models/connection/types';

// Constants
const API_BASE_URL = 'https://api.scangoapp.com';

/**
 * Service for handling contact synchronization
 */
export class ContactSyncService {
  /**
   * Request contacts permission
   * @returns Promise resolving to boolean indicating if permission was granted
   */
  async requestContactsPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result: PermissionsAndroid.PermissionStatus = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to find connections.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const { status } = await Contacts.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }
  
  /**
   * Sync contacts with server
   * @param userId User ID
   * @param authToken Authentication token
   * @returns Promise resolving to matched contacts
   */
  async syncContacts(userId: string, authToken: string): Promise<ContactMatch[]> {
    try {
      // Get contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Name,
          Contacts.Fields.Image,
        ],
      });
      
      if (data.length === 0) {
        console.log('No contacts found');
        return [];
      }
      
      // Extract phone numbers and emails with privacy-preserving hashing
      const contactHashes: { hash: string, name: string, phoneNumber: string, email?: string }[] = [];
      
      for (const contact of data) {
        if (!contact.name) continue;
        
        // Process phone numbers
        if (contact.phoneNumbers) {
          for (const phoneItem of contact.phoneNumbers) {
            if (phoneItem.number) {
              // Normalize phone number (remove non-digits)
              const normalizedPhone = phoneItem.number.replace(/\D/g, '');
              
              if (normalizedPhone.length > 0) {
                // Create privacy-preserving hash
                const hash = await Crypto.digestStringAsync(
                  Crypto.CryptoDigestAlgorithm.SHA256,
                  normalizedPhone
                );
                
                contactHashes.push({
                  hash,
                  name: contact.name,
                  phoneNumber: normalizedPhone,
                  email: contact.emails?.[0]?.email,
                });
              }
            }
          }
        }
        
        // Process emails
        if (contact.emails) {
          for (const emailItem of contact.emails) {
            if (emailItem.email) {
              // Create privacy-preserving hash
              const hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                emailItem.email.toLowerCase()
              );
              
              contactHashes.push({
                hash,
                name: contact.name,
                phoneNumber: contact.phoneNumbers?.[0]?.number?.replace(/\D/g, '') || '',
                email: emailItem.email,
              });
            }
          }
        }
      }
      
      // Send hashed contacts to server for matching
      const response = await fetch(`${API_BASE_URL}/contacts/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ contactHashes: contactHashes.map(c => c.hash) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to match contacts');
      }
      
      const matchedHashes = await response.json();
      
      // Create contact matches
      const matches: ContactMatch[] = [];
      
      for (const match of matchedHashes.matches) {
        const contactInfo = contactHashes.find(c => c.hash === match.hash);
        
        if (contactInfo) {
          matches.push({
            id: match.userId,
            name: contactInfo.name,
            phoneNumber: contactInfo.phoneNumber,
            email: contactInfo.email,
            avatar: match.avatar,
            isRegistered: true,
          });
        }
      }
      
      return matches;
    } catch (error) {
      console.error('Error syncing contacts:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const contactSyncService = new ContactSyncService();

/**
 * Hook for using contact sync in components
 * @param user User object
 * @param searchQuery Optional search query to filter contacts
 * @returns Contact sync state and functions
 */
export function useContactSync(user: any, searchQuery: string = '') {
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState(false);
  const [isContactSyncEnabled, setIsContactSyncEnabled] = useState(false);
  const [contactMatches, setContactMatches] = useState<ContactMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Request permission
  const requestPermission = useCallback(async () => {
    const granted = await contactSyncService.requestContactsPermission();
    setContactsPermissionGranted(granted);
    return granted;
  }, []);
  
  // Sync contacts
  const syncContacts = useCallback(async () => {
    if (!user) return;
    
    if (!contactsPermissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    try {
      setIsLoading(true);
      
      const matches = await contactSyncService.syncContacts(user.id, user.id); // Using user.id as token for simplicity
      setContactMatches(matches);
      setIsContactSyncEnabled(true);
      
    } catch (error) {
      console.error('Error in syncContacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, contactsPermissionGranted, requestPermission]);
  
  // Filter contacts based on search query
  const filteredContactMatches = searchQuery
    ? contactMatches.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contactMatches;
  
  return {
    contactsPermissionGranted,
    isContactSyncEnabled,
    contactMatches,
    filteredContactMatches,
    isLoading,
    requestPermission,
    syncContacts,
  };
}