/**
 * app/theme/useTheme.ts
 * 
 * Custom hook to access the theme throughout the app.
 * This hook provides access to the current theme based on the device's color scheme.
 */

import { useColorScheme } from 'react-native';
import theme, { getTheme } from './index';

/**
 * Hook to access the current theme
 * @returns The current theme object based on the device's color scheme
 */
export const useTheme = () => {
  // Get the device's color scheme
  const colorScheme = useColorScheme() || 'light';
  
  // Get the theme based on the color scheme
  const currentTheme = getTheme(colorScheme as 'light' | 'dark');
  
  return {
    // Return the current theme
    ...currentTheme,
    
    // Return the color scheme
    colorScheme,
    
    // Return helper functions
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
    
    // Return the theme object for access to all theme properties
    theme,
  };
};

export default useTheme;