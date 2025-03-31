// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './AuthContext';
import ErrorBoundary from './container/shared/ErrorBoundary';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation component that uses authentication state
function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Prevents flickering during loading

  return (
    <ErrorBoundary>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
          // Add consistent styling for all screens
          contentStyle: {
            backgroundColor: '#F9FAFB',
          }
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
          </>
        )}
        
        {/* Common screens accessible from any state */}
        <Stack.Screen 
          name="screens/QRScannerScreen" 
          options={{ 
            presentation: 'fullScreenModal', 
            animation: 'slide_from_bottom'
          }}
        />
        
        <Stack.Screen 
          name="screens/eventdetails" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}

// Root layout that provides authentication context
export default function RootLayout() {
  useEffect(() => {
    // Set global error handler to catch unhandled errors
    const errorHandler = (error: any) => {
      // Log the error for debugging
      console.error('Unhandled error:', error);
      
      // You could also log to a service or show a user-friendly error
      // We don't show alerts here to avoid bad UX, ErrorBoundary component will handle UI
    };
    
    // Set up the error handler
    if (__DEV__) {
      // In development, keep the default error handler too
      const originalErrorHandler = global.ErrorUtils.getGlobalHandler();
      
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error);
        originalErrorHandler(error, isFatal);
      });
    } else {
      // In production, replace the error handler
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }
    
    return () => {
      // Clean up if needed
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* Set default status bar style */}
        <StatusBar style="auto" />
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}