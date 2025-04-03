// app/hooks/usePayment.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import enhancedPaymentService, { PaymentDetails } from '../services/paymentService';
import { createPaymentSheetConfig } from '../lib/stripeConfig';

interface PaymentHookResult {
  isLoading: boolean;
  isPaying: boolean;
  error: string | null;
  paymentSuccess: boolean;
  paymentBreakdown: PaymentDetails | null;
  calculateFees: (price: number) => PaymentDetails;
  initiatePayment: (params: PaymentParams) => Promise<boolean>;
  resetPaymentState: () => void;
}

interface PaymentParams {
  eventId: string;
  attendeeId: string;
  amount: number;
  description: string;
  merchantName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onFailure?: (error: string) => void;
}

export function usePayment(): PaymentHookResult {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentDetails | null>(null);

  /**
   * Calculate payment fees
   */
  const calculateFees = useCallback((price: number): PaymentDetails => {
    const fees = enhancedPaymentService.calculateFeesForDisplay(price);
    setPaymentBreakdown(fees);
    return fees;
  }, []);

  /**
   * Reset payment state
   */
  const resetPaymentState = useCallback(() => {
    setError(null);
    setPaymentSuccess(false);
    setIsLoading(false);
    setIsPaying(false);
  }, []);

  /**
   * Initiate a payment flow
   */
  const initiatePayment = useCallback(async ({
    eventId,
    attendeeId,
    amount,
    description,
    merchantName = 'Event-Hive',
    onSuccess,
    onCancel,
    onFailure
  }: PaymentParams): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      setPaymentSuccess(false);
      
      // Pre-calculate fees for transparency
      const fees = calculateFees(amount);
      
      // 1. Create payment intent
      console.log(`Creating payment intent for $${amount.toFixed(2)}`);
      const { clientSecret, paymentIntentId } = await enhancedPaymentService.processTicketPayment(
        eventId,
        attendeeId,
        amount,
        description,
        { fees: JSON.stringify(fees) }
      );
      
      // 2. Initialize payment sheet
      console.log('Initializing payment sheet');
      const { error: initError } = await stripe.initPaymentSheet(
        createPaymentSheetConfig(clientSecret, merchantName)
      );
      
      if (initError) {
        throw new Error(`Payment initialization failed: ${initError.message}`);
      }
      
      // 3. Present payment sheet
      setIsPaying(true);
      console.log('Presenting payment sheet');
      const { error: presentError } = await stripe.presentPaymentSheet();
      setIsPaying(false);
      
      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('Payment was canceled by user');
          onCancel?.();
          return false;
        }
        throw new Error(`Payment failed: ${presentError.message}`);
      }
      
      // 4. Payment successful! Update records
      console.log('Payment successful, updating records');
      const success = await enhancedPaymentService.confirmAttendeePayment(
        eventId,
        attendeeId,
        paymentIntentId
      );
      
      if (!success) {
        throw new Error('Failed to update payment records');
      }
      
      // 5. Success!
      setPaymentSuccess(true);
      onSuccess?.();
      return true;
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred during payment';
      
      setError(errorMessage);
      onFailure?.(errorMessage);
      return false;
      
    } finally {
      setIsLoading(false);
    }
  }, [stripe, calculateFees]);

  return {
    isLoading,
    isPaying,
    error,
    paymentSuccess,
    paymentBreakdown,
    calculateFees,
    initiatePayment,
    resetPaymentState
  };
}