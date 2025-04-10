import { Platform } from 'react-native';

/**
 * Generate a consistent color based on text input
 * This ensures the same text always gets the same color
 */
export const getEventColor = (text: string) => {
  const colors = [
    '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', 
    '#3B82F6', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'
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
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return { bg: '#EFF6FF', text: '#1D4ED8' };
    case 'ongoing':
      return { bg: '#ECFDF5', text: '#047857' };
    case 'completed':
      return { bg: '#FEF2F2', text: '#B91C1C' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

/**
 * Create platform-specific shadow styles
 */
export const createShadow = (elevation: number) => {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.1 + (elevation * 0.03),
      shadowRadius: elevation * 0.8,
    },
    android: {
      elevation: elevation,
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