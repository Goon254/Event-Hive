// app/(tabs)/_layout.tsx (Premium Tropical Version)

import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, Dimensions, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import ErrorBoundary from '../container/shared/ErrorBoundary';
import { COLORS } from '../theme/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced premium colors
const PREMIUM_COLORS = {
  primaryGradientStart: '#00BFA6',
  primaryGradientEnd: '#00A19D',
  tabBarActive: '#00BFA6',
  tabBarInactive: '#9CA3AF',
  tabBarActiveDark: '#00CFAD',
  tabBarInactiveDark: '#9CA3AF',
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Dynamic colors based on theme
  const activeColor = isDarkMode ? PREMIUM_COLORS.tabBarActiveDark : PREMIUM_COLORS.tabBarActive;
  const inactiveColor = isDarkMode ? PREMIUM_COLORS.tabBarInactiveDark : PREMIUM_COLORS.tabBarInactive;
  const blurTint = isDarkMode ? 'dark' : 'light';
  const blurIntensity = isDarkMode ? 50 : 30;
  const backgroundColor = isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)';

  const tabBarHeight = 56; // Slightly taller for more premium feel
  const tabBarPaddingTop = 10;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? Math.max(10, insets.bottom) : 10;
  const totalTabBarHeight = tabBarHeight + tabBarPaddingTop + tabBarPaddingBottom;

  // Custom tab bar icon with indicator
  const TabBarIcon = ({
    name,
    color,
    focused
  }: {
    name: string;
    color: string;
    focused: boolean
  }) => (
    <View style={styles.tabIconContainer}>
      {focused && (
        <LinearGradient
          colors={[PREMIUM_COLORS.primaryGradientStart, PREMIUM_COLORS.primaryGradientEnd]}
          style={styles.activeIndicator}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <FontAwesome5 name={name} size={20} color={color} />
    </View>
  );

  return (
    <ErrorBoundary>
      <Tabs
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: totalTabBarHeight,
            paddingTop: tabBarPaddingTop,
            paddingBottom: tabBarPaddingBottom,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            position: 'absolute',
            elevation: 0, // Remove shadow on Android
            // Add shadow for iOS
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 5,
          },
          tabBarBackground: () => (
            <BlurView
              tint={blurTint}
              intensity={blurIntensity}
              style={{
                flex: 1,
                backgroundColor: backgroundColor,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                overflow: 'hidden',
              }}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'create',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="plus" color={color} focused={focused} />
            ),
          }}
          />
        <Tabs.Screen
          name="my-events"
          options={{
            title: 'My Events',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="calendar" color={color} focused={focused} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="user" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 48,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    width: 20,
    borderRadius: 1.5,
  },
  createTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -15, // Lift the center button above the tab bar
  },
  createTabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  createActiveIndicator: {
    position: 'absolute',
    top: -4,
    height: 3,
    width: 20,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
    marginTop: 2,
  },
});