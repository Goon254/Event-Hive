// app/utils/platformUtils.ts
import { Platform, View, Text } from 'react-native';
import React from 'react';

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
 * Creates platform-specific safe area padding utilities
 * These functions should be used with the values from useSafeAreaInsets()
 * @param insets Safe area insets from useSafeAreaInsets()
 * @param additionalPadding Additional padding to add (optional)
 * @returns Platform-specific padding style object
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function safeTopPadding(insets: SafeAreaInsets, additionalPadding: number = 0) {
  return {
    paddingTop: insets.top + additionalPadding,
  };
}

export function safeBottomPadding(insets: SafeAreaInsets, additionalPadding: number = 0) {
  return {
    paddingBottom: insets.bottom + additionalPadding,
  };
}

export function safeHorizontalPadding(insets: SafeAreaInsets, additionalPadding: number = 0) {
  return {
    paddingLeft: insets.left + additionalPadding,
    paddingRight: insets.right + additionalPadding,
  };
}

export function safeAreaPadding(insets: SafeAreaInsets, additionalPadding: number = 0) {
  return {
    paddingTop: insets.top + additionalPadding,
    paddingRight: insets.right + additionalPadding,
    paddingBottom: insets.bottom + additionalPadding,
    paddingLeft: insets.left + additionalPadding,
  };
}

/**
 * Creates platform-specific safe area margin utilities
 * These functions should be used with the values from useSafeAreaInsets()
 * @param insets Safe area insets from useSafeAreaInsets()
 * @param additionalMargin Additional margin to add (optional)
 * @returns Platform-specific margin style object
 */

export function safeTopMargin(insets: SafeAreaInsets, additionalMargin: number = 0) {
  return {
    marginTop: insets.top + additionalMargin,
  };
}

export function safeBottomMargin(insets: SafeAreaInsets, additionalMargin: number = 0) {
  return {
    marginBottom: insets.bottom + additionalMargin,
  };
}

export function safeHorizontalMargin(insets: SafeAreaInsets, additionalMargin: number = 0) {
  return {
    marginLeft: insets.left + additionalMargin,
    marginRight: insets.right + additionalMargin,
  };
}

export function safeAreaMargin(insets: SafeAreaInsets, additionalMargin: number = 0) {
  return {
    marginTop: insets.top + additionalMargin,
    marginRight: insets.right + additionalMargin,
    marginBottom: insets.bottom + additionalMargin,
    marginLeft: insets.left + additionalMargin,
  };
}

/**
 * Default export component for platform utilities
 * This component is exported to satisfy route requirements
 */
const PlatformUtilities: React.FC = () => {
  return React.createElement(
    View,
    { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } },
    React.createElement(Text, null, "Platform Utilities"),
    React.createElement(Text, null, `Current Platform: ${Platform.OS}`)
  );
};

export default PlatformUtilities;