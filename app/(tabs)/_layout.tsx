import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ErrorBoundary from '../container/shared/ErrorBoundary';
import { Platform, StyleSheet } from 'react-native';
import { createShadow } from '../utils/platformUtils';
import { COLORS } from '../theme/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height with safe area
  const tabBarHeight = 50; // Base height
  const tabBarPaddingTop = 8;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? Math.max(8, insets.bottom) : 8;
  const totalTabBarHeight = tabBarHeight + tabBarPaddingTop + tabBarPaddingBottom;
  
  return (
    <ErrorBoundary>
      <Tabs
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: COLORS.tabBarActive,
          tabBarInactiveTintColor: COLORS.tabBarInactive,
          // Prevent tab bar from moving with keyboard
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: totalTabBarHeight,
            paddingTop: tabBarPaddingTop,
            paddingBottom: tabBarPaddingBottom,
            backgroundColor: 'rgba(255, 255, 255, 0.95)', // Translucent white
            borderTopWidth: 0, // Remove top border
            position: 'absolute', // Keep tab bar fixed at bottom
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
              },
              android: {
                elevation: 10,
              },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginBottom: Platform.OS === 'ios' ? -2 : 0,
          },
          headerStyle: {
            backgroundColor: COLORS.header,
            height: Platform.OS === 'ios' ? 100 + insets.top : 80,
            ...createShadow(1),
          },
          headerTitleStyle: {
            fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
            fontSize: 18,
            color: COLORS.headerText,
          },
          // Adjust header content for safe area
          headerShadowVisible: false,
          headerTitleContainerStyle: {
            paddingTop: Platform.OS === 'ios' ? insets.top : 0,
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="home" size={22} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="newspaper" size={22} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="connections"
          options={{
            title: 'Connections',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="network-wired" size={22} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="user" size={22} color={color} />
            ),
            headerShown: false,
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
