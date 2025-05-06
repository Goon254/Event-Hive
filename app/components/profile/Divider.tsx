// app/components/profile/Divider.tsx
import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { COLORS, SPACING } from '../../theme/constants';

export type DividerVariant = 'solid' | 'dashed' | 'dotted';
export type DividerOrientation = 'horizontal' | 'vertical';

interface DividerProps {
  /**
   * Custom color for the divider (overrides theme colors)
   */
  color?: string;
  
  /**
   * Thickness of the divider in pixels
   * @default 1
   */
  thickness?: number;
  
  /**
   * Additional styles to apply to the divider
   */
  style?: object;
  
  /**
   * Orientation of the divider
   * @default 'horizontal'
   */
  orientation?: DividerOrientation;
  
  /**
   * Visual style variant of the divider
   * @default 'solid'
   */
  variant?: DividerVariant;
  
  /**
   * Spacing around the divider
   * @default 8
   */
  spacing?: number;
  
  /**
   * Alpha transparency value (0-1) for the divider color
   * @default 1
   */
  alpha?: number;
}

/**
 * A reusable divider component for separating content
 * Supports theming, orientation, and style variants
 */
const Divider: React.FC<DividerProps> = ({
  color,
  thickness = 1,
  style = {},
  orientation = 'horizontal',
  variant = 'solid',
  spacing = SPACING.xs,
  alpha = 1,
}) => {
  // Use color scheme to determine appropriate divider color
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Determine the divider color based on theme and props
  const dividerColor = color || (isDark ? COLORS.darkDivider : COLORS.divider);
  
  // Apply alpha transparency if specified
  const finalColor = alpha < 1 
    ? `${dividerColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
    : dividerColor;
  
  // Determine border style based on variant
  const borderStyle = variant === 'solid' ? 'solid' : variant;
  
  // Create dynamic styles based on orientation and other props
  const dynamicStyles = {
    backgroundColor: variant === 'solid' ? finalColor : 'transparent',
    borderColor: finalColor,
    borderStyle,
    ...(orientation === 'horizontal' 
      ? {
          height: variant === 'solid' ? thickness : thickness * 2,
          borderTopWidth: variant !== 'solid' ? thickness : 0,
          marginVertical: spacing,
          width: '100%',
        } 
      : {
          width: variant === 'solid' ? thickness : thickness * 2,
          borderLeftWidth: variant !== 'solid' ? thickness : 0,
          marginHorizontal: spacing,
          height: '100%',
        }
    ),
  };

  return (
    <View 
      style={[styles.divider, dynamicStyles, style]}
      accessibilityRole="none"
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    alignSelf: 'stretch',
  },
});

export default Divider;