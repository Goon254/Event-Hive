// constants/Constants.ts (Tropical Vibes Updated)
import { useColorScheme } from 'react-native';

export const COLORS = {
  // Primary brand colors
  primary: '#00BFA6',        // Tropical teal
  primaryDark: '#009688',    // Darker teal for pressed states
  primaryLight: '#F0FDF4',   // Light mint green background

  // Gradient colors for headers
  primaryGradientStart: '#00BFA6',
  primaryGradientEnd: '#2DD4BF',
  primaryGradientExtra: '#FCD34D', // Tropical yellow

  // UI colors
  background: '#F0FDF4',      // Very light mint green
  card: '#FFFFFF',            // White for cards
  text: '#1F2937',            // Deep neutral gray (better than hard black)
  secondaryText: '#6B7280',   // Cool neutral gray

  // Feedback colors
  success: '#22C55E',         // Green (brighter)
  warning: '#FACC15',         // Yellow
  error: '#EF4444',           // Red
  info: '#00BFA6',            // Tropical info color (Teal)

  // UI element colors
  border: '#D1FAE5',          // Minty light border
  divider: '#E5E7EB',         // Very soft gray for dividers
  placeholder: '#9CA3AF',     // Medium gray
  disabled: '#D1D5DB',        // Light gray

  // Tab bar colors
  tabBar: '#ECFDF5',          // Light mint background
  tabBarActive: '#00BFA6',    // Active tropical teal
  tabBarInactive: '#A7F3D0',  // Soft mint

  // Header colors
  header: '#F0FDF4',          // Light mint background
  headerText: '#1F2937',      // Deep gray

  // Social action colors
  likeColor: '#EF4444',
  commentColor: '#2DD4BF',
  shareColor: '#22C55E',

  // Dark mode variants
  darkBackground: '#121212',
  darkCard: '#1E1E1E',
  darkText: '#F0FDF4',
  darkSecondaryText: '#9CA3AF',
  darkBorder: '#2D2D2D',
  darkDivider: '#4B5563',

  // Transparent colors
  transparent: {
    light10: 'rgba(255, 255, 255, 0.1)',
    light20: 'rgba(255, 255, 255, 0.2)',
    light30: 'rgba(255, 255, 255, 0.3)',
    light40: 'rgba(255, 255, 255, 0.4)',
    light50: 'rgba(255, 255, 255, 0.5)',
    dark10: 'rgba(0, 0, 0, 0.1)',
    dark20: 'rgba(0, 0, 0, 0.2)',
    dark30: 'rgba(0, 0, 0, 0.3)',
    dark40: 'rgba(0, 0, 0, 0.4)',
    dark50: 'rgba(0, 0, 0, 0.5)',
  }
};

export const useThemeColors = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    background: isDark ? '#121212' : '#F7F9FC',
    text: isDark ? '#FFFFFF' : '#1F2937',
    secondaryText: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280',
    card: isDark ? 'rgba(71, 223, 177, 0.66)' : 'rgba(255, 255, 255, 0.85)',
    headerText: isDark ? '#FFFFFF' : '#FFFFFF',
    headerSubtitle: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    primaryGradient: isDark ? ['#009688', '#00796B', '#00695C'] : ['#7C4DFF', '#651FFF'],
  };
};

export const GRADIENTS = {
  primary: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd, COLORS.primaryGradientExtra] as const,
  overlay: ['transparent', 'rgba(0,0,0,0.6)'] as const,
};

export const SPACING = {
  xs: 6,
  s: 12,
  m: 20,
  l: 28,
  xl: 36,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
  },
  h3: {
    fontSize: 22,
    fontWeight: '600',
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
};

export const RADIUS = {
  xs: 6,
  s: 10,
  m: 16,
  l: 24,
  xl: 32,
  round: 9999,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const ANIMATIONS = {
  fast: 150,
  medium: 300,
  slow: 500,
};

export const Z_INDEX = {
  base: 0,
  card: 10,
  header: 20,
  modal: 30,
  tooltip: 40,
  max: 999,
};

export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  ANIMATIONS,
  Z_INDEX,
  BREAKPOINTS,
  GRADIENTS,
};
