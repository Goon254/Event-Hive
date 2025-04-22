import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { COLORS } from '../../theme/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
  statusBarColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  withSpacing?: boolean;
  testID?: string;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  ignoreBottomSafeArea?: boolean;
}

/**
 * Common screen layout component that provides consistent spacing and styling
 * across all screens in the application with proper safe area handling
 */
const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  backgroundColor = COLORS.background,
  statusBarColor = COLORS.background,
  statusBarStyle = 'light-content',
  withSpacing = true,
  testID,
  edges = ['top', 'right', 'bottom', 'left'],
  ignoreBottomSafeArea = false,
}) => {
  const insets = useSafeAreaInsets();
  
  // Adjust edges if bottom safe area should be ignored
  const safeAreaEdges = ignoreBottomSafeArea
    ? edges.filter(edge => edge !== 'bottom')
    : edges;
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      testID={testID}
      edges={safeAreaEdges}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarColor} />
      
      {/* Status Bar Spacer - only needed if top edge is not in safeAreaEdges */}
      {!safeAreaEdges.includes('top') && (
        <View style={[
          styles.statusBarSpacer,
          {
            backgroundColor: statusBarColor,
            height: insets.top
          }
        ]} />
      )}
      
      {/* Main Content */}
      <View style={[
        styles.content,
        withSpacing && {
          paddingTop: safeAreaEdges.includes('top') ? 0 : insets.top
        }
      ]}>
        {children}
      </View>
      
      {/* Bottom Spacer - only needed if ignoreBottomSafeArea is true but we still want padding */}
      {ignoreBottomSafeArea && (
        <View style={{ height: insets.bottom, backgroundColor }} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15
  },
  content: {
    flex: 1,
  }
});

export default ScreenLayout;