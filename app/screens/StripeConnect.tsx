import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';

export default function StripeConnectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

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
      
      setConnected(!!userData?.stripeAccountId);
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
      
      // TODO: Implement Stripe Connect flow
      // This would typically involve:
      // 1. Calling a backend endpoint to generate a Stripe Connect onboarding link
      // 2. Opening the link in a WebView or external browser
      // 3. Handling the OAuth callback to save the Stripe account details
      
      Alert.alert('Feature In Progress', 'Stripe Connect is not fully implemented yet.');
    } catch (error) {
      console.error('Stripe Connect error:', error);
      Alert.alert('Error', 'Failed to initialize payment account setup');
    } finally {
      setLoading(false);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Account Setup</Text>
      
      {connected ? (
        <View style={styles.connectedContainer}>
          <MaterialIcons 
            name="check-circle" 
            size={80} 
            color="#10B981" 
            style={styles.successIcon} 
          />
          
          <Text style={styles.successText}>Payment Account Connected</Text>
          
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
          <MaterialIcons 
            name="account-balance" 
            size={80} 
            color="#007AFF" 
            style={styles.setupIcon} 
          />
          
          <Text style={styles.setupDescription}>
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
            <MaterialIcons name="link" size={24} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>Connect Payment Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  setupContainer: {
    width: '100%',
    alignItems: 'center',
  },
  setupIcon: {
    marginBottom: 24,
  },
  setupDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  feeInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '90%',
    ...cardShadow,
  },
  feeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  feeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '90%',
    ...buttonShadow,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...buttonShadow,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});