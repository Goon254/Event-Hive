// app/payements/StripeProvider.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { StripeProvider as StripeReactNativeProvider } from '@stripe/stripe-react-native';
import { initializeStripe } from '../../lib/stripeConfig';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await initializeStripe();
        setIsInitialized(success);
        if (!success) {
          setInitError('Failed to initialize payment system');
        }
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        setInitError('Error initializing payment system');
        setIsInitialized(false);
      }
    };

    initialize();
  }, []);

  // Show loading indicator until Stripe is initialized
  if (!isInitialized && !initError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Setting up payment system...</Text>
      </View>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Payment System Error</Text>
        <Text style={styles.errorText}>
          {initError}. Some features may be unavailable.
        </Text>
        {/* Continue with the app anyway */}
        <>{children}</>
      </View>
    );
  }

  // Wrap the app in Stripe's provider
  return (
    <StripeReactNativeProvider
      // The publishable key is already set in the initializeStripe function,
      // but we need to provide it here as well for typing purposes
      publishableKey="pk_test_51R9phj03PVcdX2kJz8vj5IoRvVamTukQXjH6cnwPQyEp7G856KD22qB0GBcv8YdiCLfw3fIm5OJhUIUDAoR7Xivv0043UooPNC"
    >
      {children}
    </StripeReactNativeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
});