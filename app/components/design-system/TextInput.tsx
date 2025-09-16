import React from 'react';
import { View, Text, TextInput as RNTextInput, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import useTheme from '../../theme/useTheme';

export interface DSInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const TextInput: React.FC<DSInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  editable = true,
  ...rest
}) => {
  const { colors, borderRadius } = useTheme();

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.cardBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginTop: label ? 6 : 0,
          opacity: editable ? 1 : 0.6,
        }}
      >
        {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
        <RNTextInput
          style={[{ flex: 1, fontSize: 16, color: colors.text }, inputStyle]}
          placeholderTextColor={'#9CA3AF'}
          editable={editable}
          {...rest}
        />
        {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 6 }}>{error}</Text>
      ) : null}
    </View>
  );
};

export default TextInput;



