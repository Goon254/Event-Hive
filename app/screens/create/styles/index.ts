/**
 * Main styles for the Event Creation flow
 * Exports all style modules for easy access
 */

import { StyleSheet, Dimensions, Platform } from 'react-native';
import containerStyles from './containerStyles';
import formStyles from './formStyles';
import navigationStyles from './navigationStyles';
import modalStyles from './modalStyles';
import previewStyles from './previewStyles';

// Get screen dimensions for responsive styling
const { width, height } = Dimensions.get('window');

// Export dimensions for use in other style files
export const dimensions = { width, height };

// Combine all styles into a single object
const styles = {
  ...containerStyles,
  ...formStyles,
  ...navigationStyles,
  ...modalStyles,
  ...previewStyles,
};

export default styles;
