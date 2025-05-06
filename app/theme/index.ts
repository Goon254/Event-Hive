/**
 * app/theme/index.ts (Updated for Tropical Vibes Theme)
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

// Define updated color palette for Tropical Vibes
const palette = {
  primary: {
    light: '#00BFA6',
    dark: '#00BFA6',
    gradient: ['#00BFA6', '#2DD4BF', '#FCD34D'],
  },
  secondary: {
    light: '#2DD4BF',
    dark: '#2DD4BF',
  },
  accent: {
    success: '#22C55E',
    warning: '#FACC15',
    error: '#EF4444',
    info: '#00BFA6',
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F0FDF4',
    gray100: '#DCFCE7',
    gray200: '#BBF7D0',
    gray300: '#86EFAC',
    gray400: '#4ADE80',
    gray500: '#22C55E',
    gray600: '#16A34A',
    gray700: '#15803D',
    gray800: '#166534',
    gray900: '#14532D',
  },
  transparent: {
    light20: 'rgba(255, 255, 255, 0.2)',
    dark20: 'rgba(0, 0, 0, 0.2)',
  }
};

const spacing = {
  ...SPACING,
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  xxl: 48,
  screenPadding: 24,
  cardPadding: 20,
  sectionSpacing: 28,
  itemSpacing: 20,
};

const typography = {
  ...TYPOGRAPHY,
  fontFamily: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    bold: 'Poppins-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

const borderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  round: 999,
};

const createShadow = (elevation: number) => {
  return Platform.select({
    ios: {
      shadowColor: palette.neutral.black,
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.08 + (elevation * 0.02),
      shadowRadius: elevation * 1.2,
    },
    android: {
      elevation: elevation,
    },
    default: {},
  });
};

const shadows = {
  sm: createShadow(2),
  md: createShadow(4),
  lg: createShadow(8),
  xl: createShadow(12),
};

const animations = ANIMATIONS;
const zIndex = Z_INDEX;
const breakpoints = BREAKPOINTS;

const lightTheme = {
  colors: {
    primary: palette.primary.light,
    secondary: palette.secondary.light,
    background: palette.neutral.gray50,
    card: palette.neutral.white,
    text: palette.neutral.gray900,
    textSecondary: palette.neutral.gray600,
    textInverted: palette.neutral.white,
    border: palette.neutral.gray200,
    notification: palette.accent.error,
    header: palette.primary.gradient,
    headerText: palette.neutral.white,
    tabBar: palette.neutral.white,
    tabBarActive: palette.primary.light,
    tabBarInactive: palette.neutral.gray400,
    cardBackground: palette.neutral.white,
    cardBorder: palette.neutral.gray200,
    buttonPrimary: palette.primary.light,
    buttonSecondary: palette.secondary.light,
    buttonText: palette.neutral.white,
    buttonTextSecondary: palette.neutral.gray900,
    success: palette.accent.success,
    warning: palette.accent.warning,
    error: palette.accent.error,
    info: palette.accent.info,
    gradientPrimary: palette.primary.gradient,
    gradientOverlay: ['rgba(0,191,166,0.2)', 'rgba(45,212,191,0.2)', 'rgba(252,211,77,0.2)'],
  },
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Create a dark mode version of the tropical theme
const darkTheme = {
  colors: {
    primary: palette.primary.dark,
    secondary: palette.secondary.dark,
    background: '#121212', // Dark background
    card: '#1E1E1E', // Dark card background
    text: '#F0FDF4', // Light mint text for dark mode
    textSecondary: '#A7F3D0', // Soft mint for secondary text
    textInverted: '#1F2937', // Dark text for inverted elements
    border: '#2D2D2D', // Dark border
    notification: palette.accent.error,
    header: ['#009688', '#00796B', '#00695C'], // Darker teal gradient for header
    headerText: '#F0FDF4', // Light mint text
    tabBar: '#1E1E1E', // Dark tab bar
    tabBarActive: '#00BFA6', // Tropical teal
    tabBarInactive: '#4B5563', // Dark gray
    cardBackground: '#1E1E1E', // Dark card background
    cardBorder: '#2D2D2D', // Dark border
    buttonPrimary: '#00BFA6', // Tropical teal
    buttonSecondary: '#2DD4BF', // Lighter teal
    buttonText: '#F0FDF4', // Light mint text
    buttonTextSecondary: '#F0FDF4', // Light mint text
    success: palette.accent.success,
    warning: palette.accent.warning,
    error: palette.accent.error,
    info: palette.accent.info,
    gradientPrimary: ['#009688', '#00796B', '#00695C'], // Darker teal gradient
    gradientOverlay: ['rgba(0,150,136,0.2)', 'rgba(0,121,107,0.2)', 'rgba(0,105,92,0.2)'], // Darker overlay
  },
  spacing,
  typography,
  borderRadius,
  shadows: {
    sm: createShadow(3), // Slightly stronger shadows for dark mode
    md: createShadow(5),
    lg: createShadow(10),
    xl: createShadow(15),
  },
};

export const getTheme = (colorScheme: 'light' | 'dark') => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

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
};
