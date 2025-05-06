// constants/Colors.ts (Tropical Vibes Updated)

const tintColorLight = '#00BFA6'; // Teal
const tintColorDark = '#2DD4BF'; // Turquoise for dark mode

export default {
  light: {
    text: '#1F2937', // Deep gray (modern, softer than black)
    background: '#F0FDF4', // Light mint green background
    tint: tintColorLight,
    tabIconDefault: '#A7F3D0', // Soft mint for unselected icons
    tabIconSelected: tintColorLight,
    invertedText: '#FFFFFF', // white text on dark backgrounds
    secondaryText: '#6B7280', // Neutral gray for secondary text
    cardBackground: '#FFFFFF', // White for cards
    border: '#D1FAE5', // Light mint border for cards
  },
  dark: {
    text: '#F0FDF4', // Light minty text
    background: '#121212', // Deep dark background
    tint: tintColorDark,
    tabIconDefault: '#4B5563', // Muted gray for unselected icons
    tabIconSelected: tintColorDark,
    invertedText: '#000000',
    secondaryText: '#9CA3AF', // Lighter gray for secondary text
    cardBackground: '#1E1E1E', // Dark card background
    border: '#2D2D2D', // Dark border color
  },
};
