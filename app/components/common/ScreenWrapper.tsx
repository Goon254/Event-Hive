import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { createShadow } from '../../utils/platformUtils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  gradientColors?: string[];
}

interface ScreenWrapperProps {
  children: ReactNode;
  header: HeaderProps;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  withSearchBar?: boolean;
  searchBarContent?: ReactNode;
  contentContainerStyle?: any;
}

/**
 * A consistent wrapper component for shared styling across all screens.
 * Provides a standardized header with text and optional right content,
 * and an optional search bar that's embedded directly in the layout.
 */
const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  header,
  backgroundColor = COLORS.background,
  statusBarStyle = 'light-content',
  withSearchBar = false,
  searchBarContent,
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 130 : 110;
  const SEARCH_BAR_HEIGHT = 60;
  
  // Calculate the top padding for the content based on header and search bar
  const contentTopPadding = HEADER_HEIGHT + (withSearchBar ? SEARCH_BAR_HEIGHT - 15 : 0);
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor="transparent" translucent />
      
      {/* Static Header */}
      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <LinearGradient
          colors={header.gradientColors as any || [COLORS.primaryGradientStart, COLORS.primaryGradientEnd] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={[styles.headerContent, { paddingTop: Platform.OS === 'ios' ? insets.top : 25 }]}>
            <View>
              {/* Title */}
              <Text style={styles.titleText}>
                {header.title}
              </Text>
              
              {/* Subtitle */}
              {header.subtitle && (
                <Text style={styles.subtitleText}>
                  {header.subtitle}
                </Text>
              )}
            </View>
            
            {/* Right Content (buttons, icons, etc.) */}
            {header.rightContent && (
              <View style={styles.headerButtons}>
                {header.rightContent}
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
      
      {/* Search Bar - Embedded directly in the layout */}
      {withSearchBar && (
        <View style={[styles.searchBarContainer, { top: HEADER_HEIGHT - 15 }]}>
          {searchBarContent}
        </View>
      )}
      
      {/* Main Content */}
      <View 
        style={[
          styles.contentContainer, 
          { paddingTop: contentTopPadding },
          contentContainerStyle
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    ...createShadow(2),
  },
  headerGradient: {
    flex: 1,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
  },
});

export default ScreenWrapper;