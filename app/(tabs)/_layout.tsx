// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ErrorBoundary from '../container/shared/ErrorBoundary';
import { Platform, StyleSheet } from 'react-native';
import { createShadow } from '../utils/platformUtils';
import theme from '../theme';
import { COLORS } from '../theme/constants';

export default function TabsLayout() {
  // Create platform-specific tab bar shadow
  const tabBarShadow = createShadow(Platform.OS === 'ios' ? 3 : 5);
  
  return (
    <ErrorBoundary>
      <Tabs
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: COLORS.tabBarActive,
          tabBarInactiveTintColor: COLORS.tabBarInactive,
          tabBarStyle: {
            height: 60,
            paddingBottom: Platform.OS === 'ios' ? 10 : 8,
            paddingTop: Platform.OS === 'ios' ? 10 : 8,
            backgroundColor: COLORS.tabBar,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            ...tabBarShadow,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: COLORS.header,
            height: Platform.OS === 'ios' ? 100 : 80,
            ...createShadow(1),
          },
          headerTitleStyle: {
            fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
            fontSize: 18,
            color: COLORS.headerText,
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
            headerShown: false, // Hide the header for the home tab
          }}
        />
        <Tabs.Screen
          name="Feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="newspaper" size={22} color={color} />
            ),
            headerShown: false, // Hide the header for the feed tab
          }}
        />
        <Tabs.Screen
          name="connections"
          options={{
            title: 'Connections',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="network-wired" size={22} color={color} />
            ),
            headerShown: false, // Hide the header for the connections tab
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="user" size={22} color={color} />
            ),
            headerShown: false, // Hide the header for the profile tab
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