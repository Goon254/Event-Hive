// components/useColorScheme.ts or hooks/useColorScheme.ts
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  try {
    const colorScheme = useRNColorScheme();
    return colorScheme || 'light'; // Return 'light' if colorScheme is null/undefined
  } catch (error) {
    console.warn('Error in useColorScheme:', error);
    return 'light'; // Fallback to light mode on error
  }
}