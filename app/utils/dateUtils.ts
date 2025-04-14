import { Timestamp } from 'firebase/firestore';
import { format, parse, isValid, differenceInDays } from 'date-fns';

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
    
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absDiffDays = Math.abs(diffDays);
      if (absDiffDays === 0) return 'Today';
      if (absDiffDays === 1) return 'Yesterday';
      if (absDiffDays < 7) return `${absDiffDays} days ago`;
      if (absDiffDays < 30) return `${Math.floor(absDiffDays / 7)} weeks ago`;
      if (absDiffDays < 365) return `${Math.floor(absDiffDays / 30)} months ago`;
      return `${Math.floor(absDiffDays / 365)} years ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `in ${diffDays} days`;
    } else if (diffDays < 30) {
      return `in ${Math.floor(diffDays / 7)} weeks`;
    } else if (diffDays < 365) {
      return `in ${Math.floor(diffDays / 30)} months`;
    } else {
      return `in ${Math.floor(diffDays / 365)} years`;
    }
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

/**
 * Get relative days until an event
 * @param date Any date representation
 * @returns Formatted string (e.g., "1 day" or "5 days")
 */
export const getRelativeDays = (date: any): string => {
  try {
    const dateObj = toDateObject(date);
    if (!dateObj) return 'Unknown date';
    
    const now = new Date();
    const diffDays = differenceInDays(dateObj, now);
    
    if (diffDays < 0) {
      return Math.abs(diffDays) === 1 ? 'Yesterday' : `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `${diffDays} days`;
    }
  } catch (error) {
    console.error('Error calculating relative days:', error, date);
    return 'Unknown date';
  }
};