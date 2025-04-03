// app/components/PaymentModal.tsx
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
import { usePayment } from '../../hooks/usePayment';
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
          <TouchableOpacity style={styles.tryAgainButton} onPress={handlePayment}>
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