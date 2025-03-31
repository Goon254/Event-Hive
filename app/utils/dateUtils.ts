import { Timestamp } from 'firebase/firestore';

/**
 * Converts a Firebase Timestamp or Date object to a JavaScript Date
 * @param date Firebase Timestamp or Date object
 * @returns JavaScript Date object
 */
export const toDate = (date: Date | Timestamp | null): Date | null => {
  if (!date) return null;
  return date instanceof Date ? date : date.toDate();
};

/**
 * Formats a date for display with configurable options
 * @param date Firebase Timestamp or Date object
 * @param options Date formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | Timestamp | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string => {
  const jsDate = toDate(date);
  if (!jsDate) return 'No date';
  return jsDate.toLocaleDateString('en-US', options);
};

/**
 * Formats a time for display
 * @param time Firebase Timestamp or Date object
 * @param options Time formatting options
 * @returns Formatted time string
 */
export const formatTime = (
  time: Date | Timestamp | null,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const jsDate = toDate(time);
  if (!jsDate) return 'No time';
  return jsDate.toLocaleTimeString('en-US', options);
};

/**
 * Combines date and time into a single Date object
 * @param date Firebase Timestamp or Date object for the date
 * @param time Firebase Timestamp or Date object for the time
 * @returns Combined JavaScript Date object
 */
export const combineDateAndTime = (
  date: Date | Timestamp | null,
  time: Date | Timestamp | null
): Date | null => {
  const jsDate = toDate(date);
  const jsTime = toDate(time);
  
  if (!jsDate || !jsTime) return null;
  
  return new Date(
    jsDate.getFullYear(),
    jsDate.getMonth(),
    jsDate.getDate(),
    jsTime.getHours(),
    jsTime.getMinutes(),
    jsTime.getSeconds()
  );
};

/**
 * Calculates the number of days between now and a target date
 * @param date Firebase Timestamp or Date object
 * @returns Number of days from now (positive for future dates, negative for past dates)
 */
export const getDaysFromNow = (date: Date | Timestamp | null): number | null => {
  const jsDate = toDate(date);
  if (!jsDate) return null;
  
  const now = new Date();
  const diffTime = jsDate.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Returns a human-readable string for days until an event
 * @param date Firebase Timestamp or Date object
 * @returns Formatted string (e.g., "3 days from now" or "2 days ago")
 */
export const getRelativeDays = (date: Date | Timestamp | null): string => {
  const days = getDaysFromNow(date);
  if (days === null) return 'No date';
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  
  return days > 0 
    ? `${days} days from now` 
    : `${Math.abs(days)} days ago`;
};

/**
 * Determines if a date is in the past, present (today), or future
 * @param date Firebase Timestamp or Date object
 * @returns 'past', 'present', or 'future'
 */
export const getTimeframe = (
  date: Date | Timestamp | null
): 'past' | 'present' | 'future' | null => {
  const days = getDaysFromNow(date);
  if (days === null) return null;
  
  if (days < 0) return 'past';
  if (days === 0) return 'present';
  return 'future';
};