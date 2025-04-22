/**
 * app/theme/constants.ts
 * 
 * Centralized theme constants for the ScanGo app.
 * This file defines the app's color palette and design system.
 */

// Color palette
export const COLORS = {
  // Primary brand colors
  primary: '#2563EB',         // Main blue
  primaryDark: '#1D4ED8',     // Darker blue for pressed states
  primaryLight: '#DBEAFE',    // Light blue for backgrounds/highlights
  
  // Gradient colors for headers
  primaryGradientStart: '#2563EB',
  primaryGradientEnd: '#4F46E5',
  
  // UI colors
  background: '#F9FAFB',      // Light gray background
  card: '#FFFFFF',            // White for cards
  text: '#1F2937',            // Dark gray for primary text
  secondaryText: '#6B7280',   // Medium gray for secondary text
  
  // Feedback colors
  success: '#10B981',         // Green
  warning: '#F59E0B',         // Amber
  error: '#EF4444',           // Red
  info: '#3B82F6',            // Blue
  
  // UI element colors
  border: '#E5E7EB',          // Light gray for borders
  divider: '#F3F4F6',         // Very light gray for dividers
  placeholder: '#9CA3AF',     // Medium gray for placeholders
  disabled: '#D1D5DB',        // Gray for disabled elements
  
  // Tab bar colors
  tabBar: '#F9FAFB',          // Light gray for tab bar background
  tabBarActive: '#2563EB',    // Blue for active tab
  tabBarInactive: '#6B7280',  // Gray for inactive tabs
  
  // Header colors
  header: '#F9FAFB',          // Light gray for header background
  headerText: '#1F2937',      // Dark gray for header text
  
  // Social action colors
  likeColor: '#EF4444',       // Red for likes
  commentColor: '#2563EB',    // Blue for comments
  shareColor: '#10B981',      // Green for shares
  
  // Dark mode variants
  darkBackground: '#111827',
  darkCard: '#1F2937',
  darkText: '#F9FAFB',
  darkSecondaryText: '#E5E7EB',
  darkBorder: '#374151',
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

// Gradient definitions
export const GRADIENTS = {
  primary: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd] as const,
  overlay: ['transparent', 'rgba(0,0,0,0.8)'] as const,
};

// Spacing constants
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
  },
  h3: {
    fontSize: 20,
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

// Border radius
export const RADIUS = {
  xs: 4,
  s: 8,
  m: 12, 
  l: 16,
  xl: 24,
  round: 9999, // For fully rounded elements
};

// Shadow presets
export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Animations
export const ANIMATIONS = {
  fast: 150,
  medium: 300,
  slow: 500,
};

// Z-index levels
export const Z_INDEX = {
  base: 0,
  card: 10,
  header: 20,
  modal: 30,
  tooltip: 40,
  max: 999,
};

// Breakpoints
export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

// Default export for convenience
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