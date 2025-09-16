import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, StyleSheet, GestureResponderEvent, View } from 'react-native';
import useTheme from '../../theme/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const SIZE_TO_PADDING: Record<ButtonSize, { vertical: number; horizontal: number; font: number; icon: number }> = {
  sm: { vertical: 10, horizontal: 14, font: 14, icon: 14 },
  md: { vertical: 14, horizontal: 18, font: 16, icon: 16 },
  lg: { vertical: 16, horizontal: 22, font: 18, icon: 18 },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  testID,
}) => {
  const { colors, borderRadius, shadows } = useTheme();
  const dims = SIZE_TO_PADDING[size];

  const backgroundColor =
    variant === 'primary'
      ? colors.buttonPrimary
      : variant === 'secondary'
      ? colors.buttonSecondary
      : 'transparent';

  const borderColor = variant === 'ghost' ? colors.buttonPrimary : 'transparent';
  const textColor =
    variant === 'ghost' ? colors.buttonPrimary : colors.buttonText;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          paddingVertical: dims.vertical,
          paddingHorizontal: dims.horizontal,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor,
          opacity: disabled || loading ? 0.6 : 1,
        },
        variant !== 'ghost' ? shadows.md : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.buttonText} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
          <Text
            style={[
              { color: textColor, fontSize: dims.font, fontWeight: '600' },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;



