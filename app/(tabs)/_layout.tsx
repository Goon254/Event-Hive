// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ErrorBoundary from '../container/shared/ErrorBoundary';

export default function TabsLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Hide the header completely
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            height: 60,
            paddingBottom: 10,
            paddingTop: 10,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
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