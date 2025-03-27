// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './AuthContext';
import ErrorBoundary from './container/shared/ErrorBoundary';

// Navigation component that uses authentication state
function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Prevents flickering during loading

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
          </>
        )}
      </Stack>
    </ErrorBoundary>
  );
}

// Root layout that provides authentication context
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}