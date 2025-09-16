import React from 'react';
import { TouchableOpacity, View, Text, ViewStyle } from 'react-native';
import useTheme from '../../theme/useTheme';
import { MaterialIcons } from '@expo/vector-icons';

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onToggle: () => void;
  style?: ViewStyle;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onToggle, style }) => {
  const { colors, borderRadius } = useTheme();
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? colors.buttonPrimary : colors.cardBorder,
          backgroundColor: checked ? colors.buttonPrimary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
        }}
      >
        {checked ? <MaterialIcons name="check" size={16} color={colors.buttonText} /> : null}
      </View>
      {label ? <Text style={{ color: colors.text }}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

export default Checkbox;



