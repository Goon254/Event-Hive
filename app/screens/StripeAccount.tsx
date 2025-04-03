// app/screens/StripeAccount.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StatusBar,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import paymentService from '../services/paymentService';
import { createShadow } from '../utils/platformUtils';

export default function StripeAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    checkStripeAccount();
  }, [user]);

  // Check if user has a connected Stripe account
  const checkStripeAccount = async () => {
    try {
      setIsLoading(true);
      if (!user) return;
      
      const hasAccount = await paymentService.hasConnectedStripeAccount(user.id);
      setHasStripeAccount(hasAccount);
    } catch (error) {
      console.error('Error checking Stripe account:', error);
      Alert.alert('Error', 'Failed to check your payment account status');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up a Stripe Connect account
  const setupStripeAccount = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to set up payments');
        return;
      }
      
      setIsCreatingAccount(true);
      
      // Create a Connect account
      const accountLinkUrl = await paymentService.createConnectAccount(
        user.id,
        user.email,
        user.name || ''
      );
      
      // Open the URL to complete onboarding
      const supported = await Linking.canOpenURL(accountLinkUrl);
      if (supported) {
        await Linking.openURL(accountLinkUrl);
        
        // After user returns from the flow, we'll need to check the status again
        Alert.alert(
          'Onboarding Started', 
          'Please complete the Stripe onboarding process. We will check your account status when you return.',
          [
            {
              text: 'Check Status',
              onPress: checkStripeAccount
            }
          ]
        );
      } else {
        throw new Error(`Unable to open URL: ${accountLinkUrl}`);
      }
    } catch (error) {
      console.error('Error setting up Stripe account:', error);
      
      // Show a more user-friendly error
      let errorMessage = 'Failed to set up your payment account';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // For development/testing only
  const simulateStripeAccount = async () => {
    if (!__DEV__) return;
    
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to simulate account');
        return;
      }
      
      setIsCreatingAccount(true);
      const success = await paymentService.simulateStripeAccountConnection(user.id);
      
      if (success) {
        setHasStripeAccount(true);
        Alert.alert('Success', 'Successfully simulated Stripe account connection');
      } else {
        Alert.alert('Error', 'Failed to simulate Stripe account connection');
      }
    } catch (error) {
      console.error('Error simulating Stripe account:', error);
      Alert.alert('Error', 'Failed to simulate Stripe account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <FontAwesome name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Account</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Checking account status...</Text>
          </View>
        ) : hasStripeAccount ? (
          <View style={styles.accountContainer}>
            <View style={styles.accountStatusContainer}>
              <View style={styles.accountStatusIconContainer}>
                <MaterialIcons name="check-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.accountStatusTitle}>Payment Account Connected</Text>
              <Text style={styles.accountStatusDescription}>
                Your Stripe account is connected and ready to receive payments for events you organize.
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Important Information</Text>
              <View style={styles.infoCardItem}>
                <MaterialIcons name="info" size={20} color="#3B82F6" />
                <Text style={styles.infoCardText}>
                  Event payments will be automatically transferred to your connected bank account after the event.
                </Text>
              </View>
              
              <View style={styles.infoCardItem}>
                <MaterialIcons name="payments" size={20} color="#3B82F6" />
                <Text style={styles.infoCardText}>
                  The platform fee is 5% of the ticket price, plus Stripe's processing fee of 2.9% + $0.30 per transaction.
                </Text>
              </View>
              
              <View style={styles.infoCardItem}>
                <MaterialIcons name="account-balance" size={20} color="#3B82F6" />
                <Text style={styles.infoCardText}>
                  Payments typically take 2-7 business days to reach your bank account, depending on your bank.
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.dashboardButton}
              onPress={() => Linking.openURL('https://dashboard.stripe.com')}
            >
              <Text style={styles.dashboardButtonText}>Go to Stripe Dashboard</Text>
              <MaterialIcons name="open-in-new" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noAccountContainer}>
            <View style={styles.accountStatusIconContainer}>
              <MaterialIcons name="account-balance-wallet" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.noAccountTitle}>Set Up Payment Account</Text>
            <Text style={styles.noAccountDescription}>
              Connect a Stripe account to receive payments for tickets to events you organize. This is required if you want to sell tickets.
            </Text>
            
            <View style={styles.setupCard}>
              <Text style={styles.setupCardTitle}>What You'll Need</Text>
              <View style={styles.setupCardItem}>
                <FontAwesome name="id-card" size={18} color="#6B7280" style={styles.setupCardIcon} />
                <Text style={styles.setupCardText}>Legal name and address</Text>
              </View>
              
              <View style={styles.setupCardItem}>
                <FontAwesome name="bank" size={18} color="#6B7280" style={styles.setupCardIcon} />
                <Text style={styles.setupCardText}>Bank account information</Text>
              </View>
              
              <View style={styles.setupCardItem}>
                <FontAwesome name="file-text" size={18} color="#6B7280" style={styles.setupCardIcon} />
                <Text style={styles.setupCardText}>Tax ID or SSN (for US users)</Text>
              </View>
              
              <View style={styles.setupCardItem}>
                <FontAwesome name="phone" size={18} color="#6B7280" style={styles.setupCardIcon} />
                <Text style={styles.setupCardText}>Mobile phone for verification</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.setupButton}
              onPress={setupStripeAccount}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.setupButtonText}>Connect with Stripe</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
            
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.simulateButton}
                onPress={simulateStripeAccount}
                disabled={isCreatingAccount}
              >
                <Text style={styles.simulateButtonText}>Simulate Connected Account (DEV)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={styles.feeInfoContainer}>
          <Text style={styles.feeInfoTitle}>How Payments Work</Text>
          <Text style={styles.feeInfoText}>
            When attendees pay for tickets, Event-Hive collects the payment and transfers it to your Stripe account after deducting platform and processing fees.
          </Text>
          
          <View style={styles.feeBreakdown}>
            <Text style={styles.feeBreakdownTitle}>Fee Structure</Text>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Platform Fee:</Text>
              <Text style={styles.feeValue}>5% of ticket price</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Payment Processing:</Text>
              <Text style={styles.feeValue}>2.9% + $0.30 per transaction</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Payout Timeline:</Text>
              <Text style={styles.feeValue}>2-7 business days</Text>
            </View>
          </View>
          
          <Text style={styles.feeInfoNote}>
            * Stripe may require additional verification depending on your country and the volume of payments you process.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  // Styles for when account is connected
  accountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  accountStatusContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    ...cardShadow,
    marginBottom: 16,
  },
  accountStatusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountStatusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  accountStatusDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    ...cardShadow,
    marginBottom: 24,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoCardItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoCardText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  dashboardButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonShadow,
  },
  dashboardButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  // Styles for when no account is connected
  noAccountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  noAccountTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noAccountDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  setupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    ...cardShadow,
    marginBottom: 24,
  },
  setupCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  setupCardItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  setupCardIcon: {
    width: 24,
    alignItems: 'center',
  },
  setupCardText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  setupButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...buttonShadow,
    marginBottom: 12,
  },
  setupButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  simulateButton: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...buttonShadow,
  },
  simulateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Fee information styles
  feeInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    ...cardShadow,
    marginBottom: 40,
  },
  feeInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  feeInfoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  feeBreakdown: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  feeBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  feeValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  feeInfoNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});