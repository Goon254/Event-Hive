import { Platform } from 'react-native';

/**
 * Generate a consistent color based on text input
 * This ensures the same text always gets the same color
 */
export const getEventColor = (text: string) => {
  // Updated color palette to better match dark theme
  const colors = [
    '#4F46E5', // Indigo
    '#7C3AED', // Violet
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#F97316', // Orange
    '#06B6D4'  // Cyan
  ];
  
  // Simple hash function for string
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Get a consistent index in our color array
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Get color for event status
 * Updated for dark theme compatibility
 */
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'upcoming':
      return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA' };
    case 'ongoing':
      return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399' };
    case 'completed':
      return { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171' };
    default:
      return { bg: 'rgba(107, 114, 128, 0.2)', text: '#9CA3AF' };
  }
};

/**
 * Create platform-specific shadow styles
 * Enhanced for better visibility on dark backgrounds
 */
export const createShadow = (elevation: number) => {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.2 + (elevation * 0.05), // Increased opacity for dark theme
      shadowRadius: elevation * 1.2, // Increased radius for softer shadow
    },
    android: {
      elevation: elevation + 1, // Slightly increased elevation for better visibility
    },
    default: {},
  });
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 days")
 */
export const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Get appropriate text color based on background color for better readability
 * New helper for dark theme implementation
 */
export const getContrastTextColor = (bgColor: string) => {
  // For dark theme, most text will be light
  return '#FFFFFF';
};

/**
 * Create consistent section container styling
 * New helper to maintain visual consistency
 */
export const getSectionContainerStyle = () => {
  return {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    ...createShadow(2),
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
  };
};

/**
 * Create consistent section header styling
 * New helper to maintain visual consistency
 */
export const getSectionHeaderStyle = () => {
  return {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  };
};