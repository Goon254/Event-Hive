import React from 'react';
import { View, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../../theme/useTheme';

export interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  statusBarStyle?: 'light' | 'dark';
  withPadding?: boolean;
}

const Screen: React.FC<ScreenProps> = ({ children, style, contentStyle, statusBarStyle, withPadding = true }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}> 
      <StatusBar style={statusBarStyle} />
      <View style={[
        styles.content,
        withPadding ? { padding: 16, paddingTop: 16 } : undefined,
        { paddingTop: withPadding ? 16 : 0, marginTop: insets.top ? 0 : 0 },
        contentStyle,
      ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});

export default Screen;



