// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ErrorBoundary from '../container/shared/ErrorBoundary';
import { Platform, StyleSheet } from 'react-native';
import { createShadow } from '../utils/platformUtils';

export default function TabsLayout() {
  // Create platform-specific tab bar shadow
  const tabBarShadow = createShadow(Platform.OS === 'ios' ? 3 : 5);
  
  return (
    <ErrorBoundary>
      <Tabs
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            height: 60,
            paddingBottom: Platform.OS === 'ios' ? 10 : 8,
            paddingTop: Platform.OS === 'ios' ? 10 : 8,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            ...tabBarShadow,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            height: Platform.OS === 'ios' ? 100 : 80,
            ...createShadow(1),
          },
          headerTitleStyle: {
            fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
            fontSize: 18,
            color: '#1F2937',
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: '',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="plus-circle" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="compass" size={22} color={color} />
            ),
            headerShown: false, // Hide the header as we have a custom one in the explore component
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="user" size={22} color={color} />
            ),
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