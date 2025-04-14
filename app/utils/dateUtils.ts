import { Timestamp } from 'firebase/firestore';
import { format, parse, isValid, formatDistance, differenceInDays } from 'date-fns';

/**
 * Comprehensive date utilities for standardized date handling
 * Addresses "invalid time value" errors by providing consistent
 * conversion and formatting functions
 */

// Get user's timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert any date representation to a JavaScript Date object
 * Handles multiple formats:
 * - JavaScript Date objects
 * - Firebase Timestamps
 * - Timestamp-like objects with seconds
 * - ISO strings
 * - Unix timestamps (numbers)
 */
export const toDateObject = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    // Already a Date object
    if (date instanceof Date) {
      return isValid(date) ? date : null;
    }
    
    // Firebase Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate();
    }
    
    // Timestamp-like object with seconds
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    
    // ISO string or other date string
    if (typeof date === 'string') {
      try {
        // Try as ISO format
        const parsed = new Date(date);
        return isValid(parsed) ? parsed : null;
      } catch (e) {
        return null;
      }
    }
    
    // Unix timestamp (number)
    if (typeof date === 'number') {
      const parsed = new Date(date);
      return isValid(parsed) ? parsed : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting to date object:', error, date);
    return null;
  }
};

/**
 * Convert date to Firebase Timestamp
 * Ensures consistent storage format in Firestore
 */
export const toFirestoreTimestamp = (date: Date | string | number | null): Timestamp | null => {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : toDateObject(date);
    if (!dateObj) return null;
    
    return Timestamp.fromDate(dateObj);
  } catch (error) {
    console.error('Error converting to Firestore timestamp:', error, date);
    return null;
  }
};

/**
 * Format date for display with timezone consideration
 * @param date Any date representation
 * @param formatStr Format string (date-fns format)
 * @param timezone User's timezone (defaults to device timezone)
 */
export const formatDateWithTimezone = (
  date: any, 
  formatStr: string = 'MMM d, yyyy', 
  timezone: string = getUserTimezone()
): string => {
  try {
    const dateObj = toDateObject(date);
    if (!dateObj) return 'Invalid date';
    
    // Format the date directly without timezone conversion
    // We'll handle timezone display in the UI as needed
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date with timezone:', error, date);
    return 'Invalid date';
  }
};

/**
 * Format date in standard format
 * @param date Any date representation
 */
export const formatDate = (date: any): string => {
  return formatDateWithTimezone(date, 'MMM d, yyyy');
};

/**
 * Format time in standard format
 * @param date Any date representation
 */
export const formatTime = (date: any): string => {
  return formatDateWithTimezone(date, 'h:mm a');
};

/**
 * Format date and time in standard format
 * @param date Any date representation
 */
export const formatDateTime = (date: any): string => {
  return formatDateWithTimezone(date, 'MMM d, yyyy h:mm a');
};

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 * @param date Any date representation
 */
export const getRelativeTime = (date: any): string => {
  try {
    const dateObj = toDateObject(date);
    if (!dateObj) return 'Invalid date';
    
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error, date);
    return 'Invalid date';
  }
};

/**
 * Get days until event
 * @param date Any date representation
 * @returns Formatted string (e.g., "1 day" or "5 days")
 */
export const getDaysUntil = (date: any): string => {
  try {
    const dateObj = toDateObject(date);
    if (!dateObj) return '';
    
    const now = new Date();
    const diffDays = differenceInDays(dateObj, now);
    
    if (diffDays < 0) return 'Past event';
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  } catch (error) {
    console.error('Error calculating days until:', error, date);
    return '';
  }
};

/**
 * Convert local date to UTC for storage
 * @param date Local date
 * @param timezone User's timezone
 */
export const toUTCDate = (date: Date): Date => {
  // Create a UTC date from the local date
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
};

/**
 * Validate if a date is valid
 * @param date Any date representation
 */
export const isValidDate = (date: any): boolean => {
  return toDateObject(date) !== null;
};

/**
 * Get ISO string for storage
 * Ensures consistent string format for dates
 * @param date Any date representation
 */
export const toISOString = (date: any): string | null => {
  const dateObj = toDateObject(date);
  return dateObj ? dateObj.toISOString() : null;
};