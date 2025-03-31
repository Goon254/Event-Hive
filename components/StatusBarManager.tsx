import React from 'react';
import { StatusBar, Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusBarManagerProps {
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content';
  translucent?: boolean;
  children?: React.ReactNode;
}

/**
 * A consistent status bar component that works across platforms
 * Automatically handles safe area insets
 */
export default function StatusBarManager({
  backgroundColor = '#FFFFFF',
  barStyle = 'dark-content',
  translucent = false,
  children
}: StatusBarManagerProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar
        backgroundColor={translucent ? 'transparent' : backgroundColor}
        barStyle={barStyle}
        translucent={translucent}
      />
      
      {/* Add padding for status bar height on Android if not translucent */}
      {Platform.OS === 'android' && !translucent && (
        <View style={{ height: insets.top, backgroundColor }} />
      )}
      
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});