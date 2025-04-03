// app/payments/PaymentModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePayment } from '../services/usePayment';
import PaymentBreakdown from './PaymentBreakdown';
import { createShadow } from '../utils/platformUtils';

const { width, height } = Dimensions.get('window');

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  attendeeId: string;
  amount: number;
  eventName: string;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  eventId,
  attendeeId,
  amount,
  eventName,
  onPaymentSuccess
}) => {
  // Animation value for modal content
  const translateY = React.useRef(new Animated.Value(height)).current;
  
  // Payment hook
  const { 
    isLoading, 
    isPaying, 
    error, 
    paymentSuccess, 
    paymentBreakdown,
    calculateFees,
    initiatePayment,
    resetPaymentState
  } = usePayment();
  
  // Set up animation when modal visibility changes
  useEffect(() => {
    if (visible) {
      // Calculate fees when modal opens
      calculateFees(amount);
      
      // Animate modal in
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 18,
        useNativeDriver: true
      }).start();
    } else {
      // Animate modal out
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true
      }).start();
      
      // Reset payment state when closing
      resetPaymentState();
    }
  }, [visible, amount, calculateFees, resetPaymentState]);
  
  // Handle successful payment
  useEffect(() => {
    if (paymentSuccess) {
      // Wait a bit before closing the modal to show success state
      const timer = setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, onPaymentSuccess, onClose]);
  
  // Handle payment
  const handlePayment = async () => {
    await initiatePayment({
      eventId,
      attendeeId,
      amount,
      description: `Ticket for ${eventName}`,
      onCancel: () => {
        // User canceled the payment
        console.log('Payment canceled by user');
      }
    });
  };
  
  // Render payment result (success or error)
  const renderPaymentResult = () => {
    if (paymentSuccess) {
      return (
        <View style={styles.resultContainer}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>
            You're all set for the event. Check your email for a confirmation.
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.resultContainer}>
          <View style={styles.errorIcon}>
            <MaterialIcons name="error" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Payment Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.tryAgainButton} 
            onPress={handlePayment}
            accessibilityLabel="Try payment again"
          >
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      accessible={true}
      accessibilityLabel="Payment modal"
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Event Payment</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={isLoading || isPaying}
              accessibilityLabel="Close payment modal"
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {isPaying ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing payment...</Text>
            </View>
          ) : paymentSuccess || error ? (
            renderPaymentResult()
          ) : paymentBreakdown ? (
            <PaymentBreakdown
              paymentDetails={paymentBreakdown}
              onProceed={handlePayment}
              onCancel={onClose}
              isLoading={isLoading}
              buttonText="Pay with Stripe"
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow(5),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  resultContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  tryAgainButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  tryAgainText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

export default PaymentModal;