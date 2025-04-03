// app/screens/StripeConnect.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { WebView } from 'react-native-webview';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

export default function StripeConnectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    
    checkStripeConnection();
  }, [user]);

  const checkStripeConnection = async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('User is not authenticated');
      }
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.data();
      
      if (userData?.stripeAccountId) {
        setConnected(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to check payment account status');
    }
  };

  const startStripeConnect = async () => {
    try {
      setLoading(true);
      
      // Call your Firebase function to create a Connect account link
      const response = await fetch('YOUR_FIREBASE_FUNCTION_URL/create-stripe-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name
        }),
      });
      
      const { url } = await response.json();
      
      if (url) {
        setConnectUrl(url);
        setShowWebView(true);
      } else {
        throw new Error('Failed to get Stripe Connect URL');
      }
    } catch (error) {
      console.error('Stripe Connect error:', error);
      Alert.alert('Error', 'Failed to initialize payment account setup');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = async (newNavState) => {
    // Check if user has completed the flow
    if (newNavState.url.includes('stripe_connect_success')) {
      setShowWebView(false);
      await checkStripeConnection();
      Alert.alert('Success', 'Your payment account has been connected!');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  if (showWebView) {
    return (
      <WebView
        source={{ uri: connectUrl }}
        onNavigationStateChange={handleWebViewNavigationStateChange}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Account Setup</Text>
      
      {connected ? (
        <View style={styles.connectedContainer}>
          <Text style={styles.successText}>Payment account connected!</Text>
          <Text style={styles.infoText}>
            Your Stripe account is successfully connected. You can now create paid events and receive payments directly to your bank account.
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Return to Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.setupContainer}>
          <Text style={styles.infoText}>
            To create paid events, you need to connect a payment account. This allows you to receive payments directly to your bank account, minus platform and processing fees.
          </Text>
          
          <View style={styles.feeInfoContainer}>
            <Text style={styles.feeTitle}>Fee Structure:</Text>
            <Text style={styles.feeText}>• Event-Hive fee: 5% of ticket price</Text>
            <Text style={styles.feeText}>• Payment processing: 2.9% + $0.30 per transaction</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={startStripeConnect}
          >
            <Text style={styles.connectButtonText}>Connect Payment Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Add your styles here for the UI elements
});