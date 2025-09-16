import React from 'react';
import { View, ViewStyle } from 'react-native';
import useTheme from '../../theme/useTheme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

const Card: React.FC<CardProps> = ({ children, style, elevated = true }) => {
  const { colors, borderRadius, shadows } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.cardBackground,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: 16,
        },
        elevated ? shadows.md : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Card;



