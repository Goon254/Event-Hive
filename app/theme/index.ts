/**
 * app/theme/index.ts
 *
 * Centralized theme configuration for the ScanGo app.
 * This file defines colors, spacing, typography, and other design tokens
 * to ensure consistency across the app.
 */

import { Platform } from 'react-native';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  ANIMATIONS,
  Z_INDEX,
  BREAKPOINTS
} from './constants';

// Define color palette
const palette = {
  // Primary colors
  primary: {
    light: COLORS.primary,
    dark: COLORS.primary,
    gradient: GRADIENTS.primary,
  },
  
  // Secondary colors
  secondary: {
    light: '#3B82F6',
    dark: '#60A5FA',
  },
  
  // Accent colors
  accent: {
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
    info: COLORS.primary,
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

// Use spacing from constants with additional app-specific values
const spacing = {
  ...SPACING,
  // Map legacy keys to new format
  xs: SPACING.xs,
  sm: SPACING.s,
  md: SPACING.m,
  lg: SPACING.l,
  xl: SPACING.xl,
  xxl: SPACING.xxl,
  
  // App-specific spacing values
  screenPadding: SPACING.m,
  cardPadding: SPACING.m,
  sectionSpacing: SPACING.l,
  itemSpacing: SPACING.m,
};

// Merge typography from constants with app-specific font families
const typography = {
  ...TYPOGRAPHY,
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Map legacy keys to new format for backward compatibility
  fontSize: {
    xs: TYPOGRAPHY.caption.fontSize,
    sm: TYPOGRAPHY.body2.fontSize,
    md: TYPOGRAPHY.body1.fontSize,
    lg: TYPOGRAPHY.button.fontSize,
    xl: TYPOGRAPHY.h3.fontSize,
    xxl: TYPOGRAPHY.h2.fontSize,
    xxxl: TYPOGRAPHY.h1.fontSize,
  },
  
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: TYPOGRAPHY.button.fontWeight,
    bold: TYPOGRAPHY.h1.fontWeight,
  },
};

// Use border radius from constants with legacy mapping
const borderRadius = {
  ...RADIUS,
  // Map legacy keys to new format
  xs: RADIUS.xs,
  sm: RADIUS.s,
  md: RADIUS.m,
  lg: RADIUS.l,
  xl: RADIUS.xl,
  xxl: RADIUS.xl, // Map to closest value
  round: RADIUS.round,
};

// Define shadow creation utility
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

// Use shadows from constants with legacy mapping
const shadows = {
  ...SHADOWS,
  // Map legacy keys to new format
  sm: SHADOWS.light,
  md: SHADOWS.medium,
  lg: SHADOWS.strong,
  xl: createShadow(8), // Keep custom xl shadow
};

// Animation durations
const animations = ANIMATIONS;

// Z-index levels
const zIndex = Z_INDEX;

// Breakpoints
const breakpoints = BREAKPOINTS;

// Define theme for light mode (now using dark theme colors for consistency)
const lightTheme = {
  colors: {
    primary: COLORS.primary,
    secondary: palette.secondary.light,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    textSecondary: COLORS.secondaryText,
    textInverted: COLORS.background,
    border: COLORS.border,
    notification: COLORS.error,
    
    // Component specific colors
    header: COLORS.header,
    headerText: COLORS.text,
    tabBar: COLORS.tabBar,
    tabBarActive: COLORS.tabBarActive,
    tabBarInactive: COLORS.tabBarInactive,
    
    // Card colors
    cardBackground: COLORS.card,
    cardBorder: COLORS.border,
    
    // Button colors
    buttonPrimary: COLORS.primary,
    buttonSecondary: COLORS.primaryDark,
    buttonText: COLORS.text,
    buttonTextSecondary: COLORS.text,
    
    // Status colors
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
    info: COLORS.primary,
    
    // Gradient colors
    gradientPrimary: GRADIENTS.primary,
    gradientOverlay: GRADIENTS.overlay,
  },
  
  // Include other theme properties
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Define theme for dark mode (same as light theme for consistency)
const darkTheme = {
  colors: {
    primary: COLORS.primary,
    secondary: palette.secondary.dark,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    textSecondary: COLORS.secondaryText,
    textInverted: COLORS.background,
    border: COLORS.border,
    notification: COLORS.error,
    
    // Component specific colors
    header: COLORS.header,
    headerText: COLORS.text,
    tabBar: COLORS.tabBar,
    tabBarActive: COLORS.tabBarActive,
    tabBarInactive: COLORS.tabBarInactive,
    
    // Card colors
    cardBackground: COLORS.card,
    cardBorder: COLORS.border,
    
    // Button colors
    buttonPrimary: COLORS.primary,
    buttonSecondary: COLORS.primaryDark,
    buttonText: COLORS.text,
    buttonTextSecondary: COLORS.text,
    
    // Status colors
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
    info: COLORS.primary,
    
    // Gradient colors
    gradientPrimary: GRADIENTS.primary,
    gradientOverlay: GRADIENTS.overlay,
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
  animations,
  zIndex,
  breakpoints,
  colors: COLORS,
  gradients: GRADIENTS,
};