import React from 'react';
import { View, ViewStyle } from 'react-native';
import useTheme from '../../theme/useTheme';

export interface DividerProps { style?: ViewStyle; }

const Divider: React.FC<DividerProps> = ({ style }) => {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.cardBorder, width: '100%' }, style]} />;
};

export default Divider;



