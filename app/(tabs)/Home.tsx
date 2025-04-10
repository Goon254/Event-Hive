// app/(tabs)/Home.tsx
import React from 'react';
import { HomeScreen } from '../components/home';

/**
 * This file has been refactored to improve performance and maintainability.
 * The implementation has been moved to smaller, focused components in the
 * app/components/home directory.
 *
 * Key improvements:
 * - Separated UI components into smaller, reusable pieces
 * - Extracted data fetching and state management into custom hooks
 * - Used React.memo for pure components to prevent unnecessary re-renders
 * - Added proper accessibility attributes
 * - Optimized animations and list rendering
 * - Improved code organization and readability
 */

export default function EnhancedHomeScreen() {
  return <HomeScreen />;
}