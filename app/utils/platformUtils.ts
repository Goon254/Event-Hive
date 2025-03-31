import { Platform } from 'react-native';

/**
 * Creates platform-specific shadow styles
 * @param elevation Shadow intensity (1-24)
 * @returns Platform-specific shadow styles object
 */
export const createShadow = (elevation = 2) => {
  return Platform.OS === 'ios' 
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation/2 },
        shadowOpacity: 0.1,
        shadowRadius: elevation,
      } 
    : {
        elevation,
      };
};

/**
 * Creates a style object for setting safe top padding
 * based on the platform and device notch
 */
export const safeTopPadding = (extraPadding = 0) => {
  // iOS typically needs more padding for the status bar
  const basePadding = Platform.OS === 'ios' ? 44 : 30;
  return {
    paddingTop: basePadding + extraPadding,
  };
};

/**
 * Creates styles for buttons with platform-specific feedback
 */
export const buttonStyle = (color = '#007AFF') => {
  return {
    backgroundColor: color,
    // Android typically has more pronounced ripple effect
    ...Platform.select({
      android: {
        elevation: 2,
        borderRadius: 4,
      },
      ios: {
        borderRadius: 8,
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  };
};