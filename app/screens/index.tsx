// app/screens/index.tsx
import { Stack } from 'expo-router';
import { COLORS } from '../theme/constants';

/**
 * Screen navigation configuration
 * This file defines the navigation stack for all screens in the app
 */
export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ChatScreen"
        options={{
          title: 'Chat',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="scan-business-card"
        options={{
          title: 'Scan Business Card',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="personal-information"
        options={{
          title: 'Profile',
        }}
      />
    </Stack>
  );
}