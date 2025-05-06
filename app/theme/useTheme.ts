import { useColorScheme } from 'react-native';
import theme, { getTheme } from './index';

export const useTheme = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const currentTheme = getTheme(colorScheme as 'light' | 'dark');

  return {
    colorScheme,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
    ...currentTheme, // Current light/dark theme colors
    theme,           // Full theme object if needed
  };
};

export default useTheme;
