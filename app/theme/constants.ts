/**
 * app/theme/constants.ts
 * 
 * Centralized theme constants for the ScanGo app.
 * This file defines the app's color palette based on the homescreen design.
 */

// Dark theme colors from the homescreen
export const COLORS = {
  // Background colors
  background: '#000000',
  card: '#1A1A1A',
  
  // Text colors
  text: '#FFFFFF',
  secondaryText: '#B0B0B0',
  
  // Border colors
  border: 'rgba(255, 255, 255, 0.08)',
  
  // Primary colors
  primary: '#007AFF',
  primaryGradientStart: '#007AFF',
  primaryGradientEnd: '#4F46E5',
  
  // Accent colors
  accent: '#FF2D55',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  
  // Tab bar colors
  tabBar: '#1A1A1A',
  tabBarActive: '#007AFF',
  tabBarInactive: '#6B7280',
  
  // Header colors
  header: '#1A1A1A',
  headerText: '#FFFFFF',
  
  // Card colors
  cardBackground: '#1A1A1A',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  
  // Button colors
  buttonPrimary: '#007AFF',
  buttonSecondary: '#333333',
  buttonText: '#FFFFFF',
  
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
// Note: We're not using these directly with LinearGradient due to TypeScript constraints
// Instead, we're using the individual colors from COLORS
export const GRADIENTS = {
  primary: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd] as const,
  overlay: ['transparent', 'rgba(0,0,0,0.8)'] as const,
};