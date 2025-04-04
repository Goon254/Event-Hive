// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './AuthContext';
import ErrorBoundary from './container/shared/ErrorBoundary';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

// Your Stripe publishable key - in production, use environment variables
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51R9phj03PVcdX2kJz8vj5IoRvVamTukQXjH6cnwPQyEp7G856KD22qB0GBcv8YdiCLfw3fIm5OJhUIUDAoR7Xivv0043UooPNC';

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
            <Stack.Screen name="(auth)/reset-password" />
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
        
        {/* Add Payment History screen */}
        <Stack.Screen 
          name="screens/PaymentHistory" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card',
            title: 'Payment History'
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
      const originalErrorHandler = ErrorUtils?.getGlobalHandler?.();

      ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
        errorHandler(error);
        originalErrorHandler?.(error, isFatal);
      });
    } else {
      // In production, replace the error handler
      // Add a type declaration for ErrorUtils to avoid TypeScript errors
      (global as any).ErrorUtils?.setGlobalHandler?.(errorHandler);
    }
    
    return () => {
      // Clean up if needed
    };
  }, []);

  return (
    <ErrorBoundary>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.eventhive" // For Apple Pay
        urlScheme="eventhive" // Required for 3D Secure
        setReturnUrlSchemeOnAndroid={true}
      >
        <SafeAreaProvider>
          {/* Set default status bar style */}
          <StatusBar style="auto" />
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </SafeAreaProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}