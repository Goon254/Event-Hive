import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Platform, SafeAreaView } from 'react-native';
import { COLORS } from '../../theme/constants';

interface ScreenLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
  statusBarColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  withSpacing?: boolean;
  testID?: string;
}

/**
 * Common screen layout component that provides consistent spacing and styling
 * across all screens in the application
 */
const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  backgroundColor = COLORS.background,
  statusBarColor = COLORS.background,
  statusBarStyle = 'light-content',
  withSpacing = true,
  testID,
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} testID={testID}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarColor} />
      
      {/* Status Bar Spacer */}
      <View style={[
        styles.statusBarSpacer, 
        { backgroundColor: statusBarColor }
      ]} />
      
      {/* Main Content */}
      <View style={[
        styles.content,
        withSpacing && styles.contentWithSpacing
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15
  },
  content: {
    flex: 1,
  },
  contentWithSpacing: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  }
});

export default ScreenLayout;