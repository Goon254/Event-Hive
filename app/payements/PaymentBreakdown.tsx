// app/payments/PaymentModal.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { PaymentDetails } from '../services/enhancedPaymentService';
import { createShadow } from '../utils/platformUtils';

interface PaymentBreakdownProps {
  paymentDetails: PaymentDetails;
  onProceed: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  buttonText?: string;
}

const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  paymentDetails,
  onProceed,
  onCancel,
  isLoading = false,
  buttonText = 'Continue to Payment'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Summary</Text>
        <TouchableOpacity 
          style={styles.infoButton} 
          onPress={() => {
            // In a real app, show more information about fees
            console.log('Show fees info');
          }}
        >
          <FontAwesome name="info-circle" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.breakdown}>
        <View style={styles.row}>
          <Text style={styles.label}>Ticket Price</Text>
          <Text style={styles.value}>${paymentDetails.totalPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Platform Fee (5%)</Text>
          <Text style={styles.value}>${paymentDetails.platformFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Payment Processing</Text>
          <Text style={styles.value}>${paymentDetails.stripeFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${paymentDetails.totalPrice.toFixed(2)}</Text>
        </View>
      </View>
      
      <Text style={styles.noteText}>
        ${paymentDetails.creatorReceives.toFixed(2)} goes to the event organizer
      </Text>
      
      <View style={styles.secureContainer}>
        <MaterialIcons name="lock" size={16} color="#10B981" />
        <Text style={styles.secureText}>Secure payment processing by Stripe</Text>
      </View>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.proceedButton}
          onPress={onProceed}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.proceedButtonText}>{buttonText}</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Create shadow for cards based on platform
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoButton: {
    padding: 4,
  },
  breakdown: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
    color: '#4B5563',
  },
  value: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secureText: {
    fontSize: 13,
    color: '#10B981',
    marginLeft: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
  },
  proceedButton: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#047857',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow(1),
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
});

export default PaymentBreakdown;