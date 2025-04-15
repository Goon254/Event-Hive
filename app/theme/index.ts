/**
 * app/theme/index.ts
 * 
 * Centralized theme configuration for the ScanGo app.
 * This file defines colors, spacing, typography, and other design tokens
 * to ensure consistency across the app.
 */

import { Platform } from 'react-native';

// Define color palette
const palette = {
  // Primary colors
  primary: {
    light: '#007AFF',
    dark: '#0A84FF',
    gradient: ['#007AFF', '#4F46E5'],
  },
  
  // Secondary colors
  secondary: {
    light: '#3B82F6',
    dark: '#60A5FA',
  },
  
  // Accent colors
  accent: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    
    // Light mode grays
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    
    // Dark mode grays
    darkGray50: '#18181B',
    darkGray100: '#1E1E1E',
    darkGray200: '#252525',
    darkGray300: '#2D2D2D',
    darkGray400: '#333333',
    darkGray500: '#4B4B4B',
    darkGray600: '#666666',
    darkGray700: '#9CA3AF',
    darkGray800: '#D1D5DB',
    darkGray900: '#F3F4F6',
  },
  
  // Transparent colors
  transparent: {
    light10: 'rgba(255, 255, 255, 0.1)',
    light20: 'rgba(255, 255, 255, 0.2)',
    light30: 'rgba(255, 255, 255, 0.3)',
    light40: 'rgba(255, 255, 255, 0.4)',
    light50: 'rgba(255, 255, 255, 0.5)',
    light60: 'rgba(255, 255, 255, 0.6)',
    light70: 'rgba(255, 255, 255, 0.7)',
    light80: 'rgba(255, 255, 255, 0.8)',
    light90: 'rgba(255, 255, 255, 0.9)',
    
    dark10: 'rgba(0, 0, 0, 0.1)',
    dark20: 'rgba(0, 0, 0, 0.2)',
    dark30: 'rgba(0, 0, 0, 0.3)',
    dark40: 'rgba(0, 0, 0, 0.4)',
    dark50: 'rgba(0, 0, 0, 0.5)',
    dark60: 'rgba(0, 0, 0, 0.6)',
    dark70: 'rgba(0, 0, 0, 0.7)',
    dark80: 'rgba(0, 0, 0, 0.8)',
    dark90: 'rgba(0, 0, 0, 0.9)',
    
    primary10: 'rgba(0, 122, 255, 0.1)',
    primary20: 'rgba(0, 122, 255, 0.2)',
    primary30: 'rgba(0, 122, 255, 0.3)',
    primary50: 'rgba(0, 122, 255, 0.5)',
    primary70: 'rgba(0, 122, 255, 0.7)',
  },
};

// Define spacing scale
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Specific spacing values
  screenPadding: 16,
  cardPadding: 16,
  sectionSpacing: 24,
  itemSpacing: 16,
};

// Define typography
const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Define border radius
const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

// Define shadows
const createShadow = (elevation: number) => {
  return Platform.select({
    ios: {
      shadowColor: palette.neutral.black,
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1 + (elevation * 0.03),
      shadowRadius: elevation * 0.8,
    },
    android: {
      elevation: elevation,
    },
    default: {},
  });
};

const shadows = {
  sm: createShadow(1),
  md: createShadow(2),
  lg: createShadow(4),
  xl: createShadow(8),
};

// Define theme for light mode
const lightTheme = {
  colors: {
    primary: palette.primary.light,
    secondary: palette.secondary.light,
    background: palette.neutral.white,
    card: palette.neutral.gray100,
    text: palette.neutral.gray900,
    textSecondary: palette.neutral.gray600,
    textInverted: palette.neutral.white,
    border: palette.neutral.gray300,
    notification: palette.accent.error,
    
    // Component specific colors
    header: palette.primary.light,
    headerText: palette.neutral.white,
    tabBar: palette.neutral.white,
    tabBarActive: palette.primary.light,
    tabBarInactive: palette.neutral.gray400,
    
    // Card colors
    cardBackground: palette.neutral.white,
    cardBorder: palette.neutral.gray200,
    
    // Button colors
    buttonPrimary: palette.primary.light,
    buttonSecondary: palette.neutral.gray200,
    buttonText: palette.neutral.white,
    buttonTextSecondary: palette.neutral.gray800,
    
    // Status colors
    success: palette.accent.success,
    warning: palette.accent.warning,
    error: palette.accent.error,
    info: palette.accent.info,
    
    // Gradient colors
    gradientPrimary: palette.primary.gradient,
    gradientOverlay: ['transparent', 'rgba(0,0,0,0.8)'],
  },
  
  // Include other theme properties
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Define theme for dark mode
const darkTheme = {
  colors: {
    primary: palette.primary.dark,
    secondary: palette.secondary.dark,
    background: palette.neutral.darkGray100,
    card: palette.neutral.darkGray200,
    text: palette.neutral.white,
    textSecondary: palette.neutral.darkGray700,
    textInverted: palette.neutral.darkGray100,
    border: palette.neutral.darkGray300,
    notification: palette.accent.error,
    
    // Component specific colors
    header: palette.primary.dark,
    headerText: palette.neutral.white,
    tabBar: palette.neutral.darkGray100,
    tabBarActive: palette.primary.dark,
    tabBarInactive: palette.neutral.darkGray500,
    
    // Card colors
    cardBackground: palette.neutral.darkGray200,
    cardBorder: palette.neutral.darkGray300,
    
    // Button colors
    buttonPrimary: palette.primary.dark,
    buttonSecondary: palette.neutral.darkGray300,
    buttonText: palette.neutral.white,
    buttonTextSecondary: palette.neutral.darkGray800,
    
    // Status colors
    success: palette.accent.success,
    warning: palette.accent.warning,
    error: palette.accent.error,
    info: palette.accent.info,
    
    // Gradient colors
    gradientPrimary: palette.primary.gradient,
    gradientOverlay: ['transparent', 'rgba(0,0,0,0.8)'],
  },
  
  // Include other theme properties
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Create a function to get the current theme based on color scheme
export const getTheme = (colorScheme: 'light' | 'dark') => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// Export theme components
export default {
  light: lightTheme,
  dark: darkTheme,
  getTheme,
  palette,
  spacing,
  typography,
  borderRadius,
  shadows,
  createShadow,
};