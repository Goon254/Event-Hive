// app/utils/authSecurity.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

// Constants
const LOGIN_ATTEMPTS_KEY = 'auth_login_attempts';
const LOCKOUT_TIME_KEY = 'auth_lockout_time';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const PASSWORD_RESET_KEY = 'auth_password_reset_requests';
const MAX_PASSWORD_RESET_REQUESTS = 3;
const PASSWORD_RESET_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Interface for login attempt tracking
 */
interface LoginAttempts {
  count: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  ipAddress?: string;
  deviceId?: string;
}

/**
 * Interface for password reset request tracking
 */
interface PasswordResetRequests {
  count: number;
  firstRequestTime: number;
  lastRequestTime: number;
  email: string;
}

/**
 * Check if the user's account is currently locked out
 * @returns Promise resolving to a boolean indicating if the account is locked out
 */
export const isAccountLockedOut = async (): Promise<boolean> => {
  try {
    const lockoutTimeStr = await AsyncStorage.getItem(LOCKOUT_TIME_KEY);
    
    if (!lockoutTimeStr) {
      return false;
    }
    
    const lockoutTime = parseInt(lockoutTimeStr, 10);
    const currentTime = Date.now();
    
    // If the lockout time has passed, clear the lockout
    if (currentTime > lockoutTime) {
      await AsyncStorage.removeItem(LOCKOUT_TIME_KEY);
      await AsyncStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return false;
    }
    
    // Account is still locked out
    return true;
  } catch (error) {
    console.error('Error checking account lockout:', error);
    return false; // Default to not locked out in case of error
  }
};

/**
 * Get the remaining lockout time in seconds
 * @returns Promise resolving to the remaining lockout time in seconds, or 0 if not locked out
 */
export const getRemainingLockoutTime = async (): Promise<number> => {
  try {
    const lockoutTimeStr = await AsyncStorage.getItem(LOCKOUT_TIME_KEY);
    
    if (!lockoutTimeStr) {
      return 0;
    }
    
    const lockoutTime = parseInt(lockoutTimeStr, 10);
    const currentTime = Date.now();
    
    // If the lockout time has passed, clear the lockout
    if (currentTime > lockoutTime) {
      await AsyncStorage.removeItem(LOCKOUT_TIME_KEY);
      await AsyncStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return 0;
    }
    
    // Calculate remaining time in seconds
    return Math.ceil((lockoutTime - currentTime) / 1000);
  } catch (error) {
    console.error('Error getting remaining lockout time:', error);
    return 0;
  }
};

/**
 * Record a failed login attempt and check if the account should be locked out
 * @param email The email address that failed to login
 * @returns Promise resolving to a boolean indicating if the account is now locked out
 */
export const recordFailedLoginAttempt = async (email: string): Promise<boolean> => {
  try {
    // Get current login attempts
    const attemptsJson = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
    let attempts: LoginAttempts = attemptsJson 
      ? JSON.parse(attemptsJson) 
      : { count: 0, firstAttemptTime: Date.now(), lastAttemptTime: Date.now() };
    
    const currentTime = Date.now();
    
    // If this is the first attempt or if the window has reset (24 hours since first attempt)
    if (attempts.count === 0 || currentTime - attempts.firstAttemptTime > 24 * 60 * 60 * 1000) {
      attempts = {
        count: 1,
        firstAttemptTime: currentTime,
        lastAttemptTime: currentTime
      };
    } else {
      // Increment the attempt count
      attempts.count += 1;
      attempts.lastAttemptTime = currentTime;
    }
    
    // Save the updated attempts
    await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    
    // Check if we should lock the account
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = currentTime + LOCKOUT_DURATION;
      await AsyncStorage.setItem(LOCKOUT_TIME_KEY, lockoutTime.toString());
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error recording failed login attempt:', error);
    return false;
  }
};

/**
 * Reset the login attempts counter after a successful login
 */
export const resetLoginAttempts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    await AsyncStorage.removeItem(LOCKOUT_TIME_KEY);
  } catch (error) {
    console.error('Error resetting login attempts:', error);
  }
};

/**
 * Check if the user can request a password reset
 * @param email The email address requesting a password reset
 * @returns Promise resolving to a boolean indicating if the user can request a password reset
 */
export const canRequestPasswordReset = async (email: string): Promise<boolean> => {
  try {
    const key = `${PASSWORD_RESET_KEY}_${email}`;
    const requestsJson = await AsyncStorage.getItem(key);
    
    if (!requestsJson) {
      return true;
    }
    
    const requests: PasswordResetRequests = JSON.parse(requestsJson);
    const currentTime = Date.now();
    
    // If the window has reset (24 hours since first request)
    if (currentTime - requests.firstRequestTime > PASSWORD_RESET_WINDOW) {
      return true;
    }
    
    // Check if the user has exceeded the maximum number of requests
    return requests.count < MAX_PASSWORD_RESET_REQUESTS;
  } catch (error) {
    console.error('Error checking password reset requests:', error);
    return true; // Default to allowing password reset in case of error
  }
};

/**
 * Record a password reset request
 * @param email The email address requesting a password reset
 * @returns Promise resolving to a boolean indicating if the request was recorded successfully
 */
export const recordPasswordResetRequest = async (email: string): Promise<boolean> => {
  try {
    const key = `${PASSWORD_RESET_KEY}_${email}`;
    const requestsJson = await AsyncStorage.getItem(key);
    const currentTime = Date.now();
    
    let requests: PasswordResetRequests;
    
    if (!requestsJson) {
      requests = {
        count: 1,
        firstRequestTime: currentTime,
        lastRequestTime: currentTime,
        email
      };
    } else {
      requests = JSON.parse(requestsJson);
      
      // If the window has reset (24 hours since first request)
      if (currentTime - requests.firstRequestTime > PASSWORD_RESET_WINDOW) {
        requests = {
          count: 1,
          firstRequestTime: currentTime,
          lastRequestTime: currentTime,
          email
        };
      } else {
        // Increment the request count
        requests.count += 1;
        requests.lastRequestTime = currentTime;
      }
    }
    
    // Save the updated requests
    await AsyncStorage.setItem(key, JSON.stringify(requests));
    
    return true;
  } catch (error) {
    console.error('Error recording password reset request:', error);
    return false;
  }
};

/**
 * Generate a secure random password
 * @param length The length of the password to generate
 * @returns Promise resolving to a secure random password
 */
export const generateSecurePassword = async (length: number = 12): Promise<string> => {
  try {
    // Generate random bytes
    const randomBytes = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36) + Date.now().toString(),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    // Define character sets
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    // Ensure at least one character from each set
    let password = '';
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Fill the rest of the password with random characters
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars.charAt(randomIndex);
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    return password;
  } catch (error) {
    console.error('Error generating secure password:', error);
    throw error;
  }
};

/**
 * Check if a password has been compromised in known data breaches
 * This uses the "Have I Been Pwned" API with k-anonymity
 * @param password The password to check
 * @returns Promise resolving to a boolean indicating if the password has been compromised
 */
export const isPasswordCompromised = async (password: string): Promise<boolean> => {
  try {
    // Generate SHA-1 hash of the password
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      password
    );
    
    // Convert hash to uppercase
    const hashUpper = hash.toUpperCase();
    
    // Get the first 5 characters of the hash (prefix)
    const prefix = hashUpper.substring(0, 5);
    
    // Get the rest of the hash (suffix)
    const suffix = hashUpper.substring(5);
    
    // Query the "Have I Been Pwned" API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Get the response text
    const text = await response.text();
    
    // Split the response into lines
    const lines = text.split('\n');
    
    // Check if the suffix is in the response
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      
      if (hashSuffix.trim() === suffix) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if password is compromised:', error);
    return false; // Default to not compromised in case of error
  }
};

/**
 * Show a password strength meter
 * @param password The password to check
 * @returns An object with the password strength score and feedback
 */
export const getPasswordStrength = (password: string): { 
  score: number; 
  feedback: string;
  color: string;
} => {
  let score = 0;
  
  // Length check
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  }
  
  // Uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  // Lowercase letters
  if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  // Numbers
  if (/[0-9]/.test(password)) {
    score += 1;
  }
  
  // Special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }
  
  // Variety of characters
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= 8) {
    score += 1;
  }
  
  // Determine feedback based on score
  let feedback = '';
  let color = '';
  
  switch (true) {
    case score <= 2:
      feedback = 'Weak - Easy to guess';
      color = '#EF4444'; // Red
      break;
    case score <= 4:
      feedback = 'Fair - Could be stronger';
      color = '#F59E0B'; // Amber
      break;
    case score <= 6:
      feedback = 'Good - Difficult to guess';
      color = '#10B981'; // Green
      break;
    default:
      feedback = 'Strong - Very difficult to guess';
      color = '#059669'; // Dark green
      break;
  }
  
  return { score, feedback, color };
};

/**
 * Securely store sensitive data
 * @param key The key to store the data under
 * @param value The value to store
 * @returns Promise resolving to a boolean indicating if the data was stored successfully
 */
export const secureStore = async (key: string, value: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error('Error storing secure data:', error);
    
    // Fallback to AsyncStorage with a warning
    try {
      await AsyncStorage.setItem(key, value);
      console.warn('Falling back to AsyncStorage for secure data - this is less secure');
      return true;
    } catch (fallbackError) {
      console.error('Error falling back to AsyncStorage:', fallbackError);
      return false;
    }
  }
};

/**
 * Securely retrieve sensitive data
 * @param key The key to retrieve the data for
 * @returns Promise resolving to the stored value, or null if not found
 */
export const secureRetrieve = async (key: string): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    console.error('Error retrieving secure data:', error);
    
    // Fallback to AsyncStorage with a warning
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.warn('Retrieved sensitive data from AsyncStorage - this is less secure');
      }
      return value;
    } catch (fallbackError) {
      console.error('Error falling back to AsyncStorage:', fallbackError);
      return null;
    }
  }
};

/**
 * Securely delete sensitive data
 * @param key The key to delete the data for
 * @returns Promise resolving to a boolean indicating if the data was deleted successfully
 */
export const secureDelete = async (key: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    
    // Also try to delete from AsyncStorage in case it was stored there as a fallback
    try {
      await AsyncStorage.removeItem(key);
    } catch (asyncError) {
      // Ignore errors from AsyncStorage
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting secure data:', error);
    return false;
  }
};