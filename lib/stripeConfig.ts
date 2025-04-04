// lib/stripeConfig.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initStripe } from '@stripe/stripe-react-native';

// Publishable key - this would normally come from your environment variables
// For a real app, you'd use different keys for iOS and Android
const STRIPE_PUBLISHABLE_KEY = Platform.select({
  ios: 'pk_test_51R9phj03PVcdX2kJz8vj5IoRvVamTukQXjH6cnwPQyEp7G856KD22qB0GBcv8YdiCLfw3fIm5OJhUIUDAoR7Xivv0043UooPNC',
  android: 'pk_test_51R9phj03PVcdX2kJz8vj5IoRvVamTukQXjH6cnwPQyEp7G856KD22qB0GBcv8YdiCLfw3fIm5OJhUIUDAoR7Xivv0043UooPNC',
  default: 'pk_test_51R9phj03PVcdX2kJz8vj5IoRvVamTukQXjH6cnwPQyEp7G856KD22qB0GBcv8YdiCLfw3fIm5OJhUIUDAoR7Xivv0043UooPNC'
});

// Your backend URL for creating payment intents
// In a real app, this would be your actual server endpoint
export const PAYMENT_API_URL = 'https://your-backend.com/api/payments';

/**
 * Initialize Stripe with your publishable key
 */
export const initializeStripe = async () => {
  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.eventhive', // Only needed for Apple Pay
      urlScheme: 'eventhive', // Only needed for 3D Secure
      setReturnUrlSchemeOnAndroid: true,
    });
    console.log('Stripe initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return false;
  }
};

/**
 * Create a payment sheet configuration
 */
export const createPaymentSheetConfig = (clientSecret: string, merchantName: string = 'Event-Hive') => {
  return {
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: merchantName,
    style: 'alwaysLight', // or 'alwaysDark'
    // Enable these for Apple Pay and Google Pay:
    applePay: {
      merchantCountryCode: 'US',
    },
    googlePay: {
      merchantCountryCode: 'US',
      testEnv: __DEV__, // Use test environment in development
      currencyCode: 'USD',
    },
    // Custom appearance configs if needed
    appearance: {
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        componentBackground: '#F3F4F6',
        componentBorder: '#E5E7EB',
        componentDivider: '#E5E7EB',
        primaryText: '#1F2937',
        secondaryText: '#6B7280',
        componentText: '#1F2937',
        placeholderText: '#9CA3AF',
      },
    },
  };
};