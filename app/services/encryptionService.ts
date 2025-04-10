// app/services/encryptionService.ts
import { useState, useEffect } from 'react';
import { EncryptionKeys } from '../models/connection/types';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Constants
const ENCRYPTION_KEYS_KEY = 'encryption_keys';
const API_BASE_URL = 'https://api.scangoapp.com';

/**
 * Service for handling encryption operations
 */
export class EncryptionService {
  /**
   * Load or generate encryption keys
   * @param userId User ID for key storage
   * @returns Promise resolving to encryption keys
   */
  async loadOrGenerateKeys(userId: string): Promise<EncryptionKeys> {
    try {
      // Try to load existing keys
      const keysJson = await SecureStore.getItemAsync(`${ENCRYPTION_KEYS_KEY}_${userId}`);
      
      if (keysJson) {
        const keys = JSON.parse(keysJson) as EncryptionKeys;
        console.log('Loaded existing encryption keys');
        return keys;
      } else {
        // Generate new keys
        const keys = await this.generateKeys(userId);
        
        // Store keys securely
        await SecureStore.setItemAsync(
          `${ENCRYPTION_KEYS_KEY}_${userId}`,
          JSON.stringify(keys)
        );
        
        // Upload public key to server
        await this.updatePublicKey(userId, keys.publicKey);
        
        console.log('Generated new encryption keys');
        return keys;
      }
    } catch (error) {
      console.error('Error with encryption keys:', error);
      throw error;
    }
  }
  
  /**
   * Generate new encryption keys
   * @param userId User ID for key generation
   * @returns Promise resolving to new encryption keys
   */
  private async generateKeys(userId: string): Promise<EncryptionKeys> {
    // In a real implementation, this would use proper asymmetric encryption
    // For this example, we'll create a simple key pair
    const privateKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${userId}-${Date.now()}-private`
    );
    
    const publicKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${userId}-${Date.now()}-public`
    );
    
    return { privateKey, publicKey };
  }
  
  /**
   * Update public key on server
   * @param userId User ID
   * @param publicKey Public key to update
   */
  async updatePublicKey(userId: string, publicKey: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/users/${userId}/publicKey`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicKey }),
      });
    } catch (error) {
      console.error('Error updating public key:', error);
      throw error;
    }
  }
  
  /**
   * Encrypt a message
   * @param message Message to encrypt
   * @param publicKey Recipient's public key
   * @returns Encrypted message
   */
  async encryptMessage(message: string, publicKey: string): Promise<string> {
    // In a real implementation, this would use proper asymmetric encryption
    // For this example, we'll use a simple base64 encoding with the public key
    try {
      const combined = `${message}:${publicKey}`;
      return btoa(combined);
    } catch (error) {
      console.error('Error encrypting message:', error);
      return message;
    }
  }
  
  /**
   * Decrypt a message
   * @param encryptedMessage Encrypted message
   * @param privateKey Private key for decryption
   * @returns Decrypted message
   */
  async decryptMessage(encryptedMessage: string, privateKey: string): Promise<string> {
    // In a real implementation, this would use proper asymmetric decryption
    // For this example, we'll use a simple base64 decoding
    try {
      const decoded = atob(encryptedMessage);
      const parts = decoded.split(':');
      
      // Verify the message was encrypted for this user
      if (parts.length === 2) {
        return parts[0];
      }
      
      return encryptedMessage;
    } catch (error) {
      console.error('Error decrypting message:', error);
      return encryptedMessage;
    }
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService();

/**
 * Hook for using encryption in components
 * @param user User object
 * @returns Encryption state and functions
 */
export function useEncryption(user: any) {
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [keys, setKeys] = useState<EncryptionKeys | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    // Load or generate keys
    const loadKeys = async () => {
      try {
        const loadedKeys = await encryptionService.loadOrGenerateKeys(user.id);
        setKeys(loadedKeys);
      } catch (error) {
        console.error('Error loading encryption keys:', error);
      }
    };
    
    if (encryptionEnabled) {
      loadKeys();
    }
  }, [user, encryptionEnabled]);
  
  return {
    encryptionEnabled,
    setEncryptionEnabled,
    keys,
    encryptMessage: async (message: string, publicKey: string) => {
      if (!encryptionEnabled) return message;
      return encryptionService.encryptMessage(message, publicKey);
    },
    decryptMessage: async (message: string) => {
      if (!encryptionEnabled || !keys) return message;
      return encryptionService.decryptMessage(message, keys.privateKey);
    },
  };
}