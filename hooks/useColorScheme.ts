import { Platform } from 'react-native';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  // Use the web implementation if on web platform
  if (Platform.OS === 'web') {
    // Always return light for server rendering on web
    return 'light';
  }
  
  // For native platforms, use the React Native implementation
  return useRNColorScheme();
}