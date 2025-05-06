// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './AuthContext';
import ErrorBoundary from './container/shared/ErrorBoundary';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Keep splash screen visible while initializing
SplashScreen.preventAutoHideAsync();

// Get Stripe key from environment variables or constants
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 
  'pk_test_51R9phj03PVcdX2kJz8vj5IoRvVamTukQXjH6cnwPQyEp7G856KD22qB0GBcv8YdiCLfw3fIm5OJhUIUDAoR7Xivv0043UooPNC';

// Navigation component that uses authentication state
function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Handle initial app loading
  useEffect(() => {
    async function prepare() {
      try {
        // Perform any initialization tasks here
        // For example, preload fonts, images, or make initial API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    
    prepare();
  }, []);
  
  // Show nothing until loading is complete
  if (isLoading || !appIsReady) return null;
  
  // Background color based on theme
  const backgroundColor = isDarkMode ? '#121212' : '#F9FAFB';

  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
          // Add consistent styling for all screens that respects theme
          contentStyle: {
            backgroundColor,
          },
          // Add default header styling that respects theme
          headerStyle: {
            backgroundColor,
          },
          headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
          </>
        )}
        
        {/* Common screens accessible from any state */}
        <Stack.Screen
          name="screens/QRScannerScreen"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen
          name="screens/scan"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen
          name="screens/eventdetails"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        
        {/* Payment History screen */}
        <Stack.Screen
          name="screens/PaymentHistory"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            title: 'Payment History',
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
        
        <Stack.Screen
          name="screens/create"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack>
    </ErrorBoundary>
  );
}

// Root layout that provides authentication context
export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    // Set global error handler to catch unhandled errors
    const errorHandler = (error: any) => {
      // Log the error for debugging
      console.error('Unhandled error:', error);
      
      // In production, you could send to a monitoring service like Sentry
      if (!__DEV__) {
        // Implement error logging service here
        // Example: Sentry.captureException(error);
      }
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
          {/* Status bar adapts to light/dark theme */}
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </SafeAreaProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}