// app/utils/platformUtils.ts
import { Platform } from 'react-native';

/**
 * Creates platform-specific shadow styles
 * @param elevation Shadow elevation (1-24)
 * @returns Shadow style object
 */
export function createShadow(elevation: number = 2) {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.1 + (elevation * 0.03),
      shadowRadius: elevation * 0.8,
    };
  } else {
    return {
      elevation: elevation,
    };
  }
}

/**
 * Determines if the platform is web
 * @returns Boolean indicating if platform is web
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * Gets platform-specific font weight
 * @param weight Font weight name
 * @returns Platform-specific font weight
 */
export function getFontWeight(weight: 'regular' | 'medium' | 'semibold' | 'bold') {
  // iOS uses specific string values, Android uses numeric values
  if (Platform.OS === 'ios') {
    switch (weight) {
      case 'regular': return '400';
      case 'medium': return '500';
      case 'semibold': return '600';
      case 'bold': return '700';
      default: return '400';
    }
  } else {
    switch (weight) {
      case 'regular': return 'normal';
      case 'medium': return '500';
      case 'semibold': return '600';
      case 'bold': return 'bold';
      default: return 'normal';
    }
  }
}

/**
 * Gets platform-specific font family
 * @returns Platform-specific font family
 */
export function getDefaultFontFamily(): string {
  if (Platform.OS === 'ios') {
    return 'System';
  } else if (Platform.OS === 'android') {
    return 'Roboto';
  } else {
    return 'sans-serif';
  }
}

/**
 * Creates platform-specific safe top padding
 * @param additionalPadding Additional padding to add (optional)
 * @returns Platform-specific padding style object
 */
export function safeTopPadding(additionalPadding: number = 0) {
  if (Platform.OS === 'ios') {
    // For iOS, we need to account for the status bar
    // This is a simplified version - in a real app you might use SafeAreaView or constants
    return {
      paddingTop: 44 + additionalPadding, // Default iOS status bar height is 44
    };
  } else {
    // For Android, we use a simpler approach
    return {
      paddingTop: 24 + additionalPadding, // Default Android status bar height
    };
  }
}