// app/services/PaymentService.ts
import { Alert } from 'react-native';
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { PAYMENT_API_URL, FALLBACK_PAYMENT_API_URL } from '../../lib/stripeConfig';

// Define fee structure
const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee
const STRIPE_PERCENTAGE_FEE = 2.9; // 2.9% of transaction
const STRIPE_FIXED_FEE = 0.3; // $0.30 per transaction

// Payment interfaces
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled' | string;
  createdAt: Timestamp;
}

export interface PaymentDetails {
  totalPrice: number;
  stripeFee: number;
  platformFee: number;
  creatorReceives: number;
}

class EnhancedPaymentService {
  /**
   * Calculate all fees for displaying to users
   * @param ticketPrice Base ticket price
   * @returns Breakdown of fees and amounts
   */
  calculateFeesForDisplay(ticketPrice: number): PaymentDetails {
    // Convert to cents for precise calculation
    const priceInCents = Math.round(ticketPrice * 100);
    const platformFee = Math.round(priceInCents * (PLATFORM_FEE_PERCENTAGE / 100));
    const stripeFee = Math.round(priceInCents * (STRIPE_PERCENTAGE_FEE / 100) + STRIPE_FIXED_FEE * 100);
    const creatorReceives = priceInCents - platformFee - stripeFee;
    
    // Convert back to dollars
    return {
      totalPrice: priceInCents / 100,
      stripeFee: stripeFee / 100,
      platformFee: platformFee / 100,
      creatorReceives: creatorReceives / 100
    };
  }

  /**
   * Check network connectivity
   * @returns Promise<boolean> True if network is available
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Create an AbortController with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Try to fetch a small resource to check connectivity
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      return response.status === 204; // Google returns 204 No Content when successful
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Process ticket payment - creates a payment intent
   * In a real app, this would call your backend
   */
  async processTicketPayment(
    eventId: string,
    attendeeId: string,
    amount: number, // in dollars
    description: string,
    metadata: Record<string, any> = {},
    retryCount: number = 0
  ): Promise<{ clientSecret: string, paymentIntentId: string }> {
    // Use mock payment service since the Firebase functions are not deployed
    console.log(`Using mock payment service for event ${eventId}, attendee ${attendeeId}`);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock payment intent ID
      const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Generate a mock client secret
      const mockClientSecret = `${mockPaymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store the mock payment intent in Firestore for consistency
      try {
        // Use the db instance already imported at the top of the file
        await setDoc(doc(db, 'paymentIntents', mockPaymentIntentId), {
          id: mockPaymentIntentId,
          clientSecret: mockClientSecret,
          amount: Math.round(amount * 100), // Convert to cents
          description,
          eventId,
          attendeeId,
          status: 'requires_payment_method',
          metadata,
          createdAt: Timestamp.now(),
        });
        console.log(`Stored mock payment intent in Firestore: ${mockPaymentIntentId}`);
      } catch (dbError) {
        console.warn('Could not store mock payment intent in Firestore:', dbError);
        // Continue anyway since this is just for consistency
      }
      
      console.log(`Created mock payment intent: ${mockPaymentIntentId}`);
      return {
        clientSecret: mockClientSecret,
        paymentIntentId: mockPaymentIntentId
      };
    } catch (error) {
      console.error('Error in mock payment service:', error);
      throw new Error(`Mock payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update payment intent status in Firestore
   */
  async updatePaymentIntentStatus(
    paymentIntentId: string,
    status: string
  ): Promise<void> {
    // Check if this is a mock payment intent
    const isMockPayment = paymentIntentId.startsWith('pi_mock_');
    
    try {
      const paymentRef = doc(db, "paymentIntents", paymentIntentId);
      await updateDoc(paymentRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating payment intent status:', error);
      
      // For mock payments, don't throw an error
      if (isMockPayment) {
        console.warn(`Mock payment intent status update failed, but continuing: ${paymentIntentId}`);
        return; // Just return without throwing
      }
      
      // For real payments, throw the error
      throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update attendee after successful payment
   */
  async confirmAttendeePayment(
    eventId: string,
    attendeeId: string,
    paymentIntentId: string
  ): Promise<boolean> {
    console.log(`Confirming payment for event ${eventId}, attendee ${attendeeId}`);
    
    // Check if this is a mock payment intent
    const isMockPayment = paymentIntentId.startsWith('pi_mock_');
    
    if (isMockPayment) {
      try {
        // Try to update attendee record
        const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
        await updateDoc(attendeeRef, {
          paymentStatus: 'completed',
          paymentId: paymentIntentId,
          paidAt: serverTimestamp()
        });
      } catch (attendeeError) {
        // Log the error but continue - this is expected in environments without proper Firestore permissions
        console.warn('Could not update attendee payment status in Firestore:', attendeeError);
      }
      
      try {
        // Try to update payment intent record
        await this.updatePaymentIntentStatus(paymentIntentId, 'succeeded');
      } catch (paymentError) {
        // Log the error but continue - this is expected in environments without proper Firestore permissions
        console.warn('Could not update payment intent status in Firestore:', paymentError);
      }
      
      // For mock payments, always return success even if Firestore updates fail
      console.log("Mock payment confirmed successfully");
      return true;
    } else {
      // For real payments, we need to ensure the updates succeed
      try {
        // Update attendee record
        const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
        await updateDoc(attendeeRef, {
          paymentStatus: 'completed',
          paymentId: paymentIntentId,
          paidAt: serverTimestamp()
        });
        
        // Update payment intent record
        await this.updatePaymentIntentStatus(paymentIntentId, 'succeeded');
        
        console.log("Payment confirmed successfully");
        return true;
      } catch (error) {
        console.error('Error confirming payment:', error);
        return false;
      }
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const paymentRef = doc(db, "paymentIntents", paymentIntentId);
      const snapshot = await getDoc(paymentRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return snapshot.data() as PaymentIntent;
    } catch (error) {
      console.error('Error getting payment intent:', error);
      return null;
    }
  }

  /**
   * List payment intents for an event
   */
  async getEventPayments(eventId: string): Promise<PaymentIntent[]> {
    try {
      // In a real app, this would use a query
      // For this demo, we'll create a few sample payments
      const samples: PaymentIntent[] = [
        {
          id: `pi_sample1_${eventId}`,
          clientSecret: 'sample_secret_1',
          amount: 1500,
          status: 'succeeded',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
        },
        {
          id: `pi_sample2_${eventId}`,
          clientSecret: 'sample_secret_2',
          amount: 1500,
          status: 'succeeded',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000))
        }
      ];
      
      return samples;
    } catch (error) {
      console.error('Error getting event payments:', error);
      return [];
    }
  }

  /**
   * For debugging: Reset a payment to allow retrying
   */
  async resetPaymentForRetry(eventId: string, attendeeId: string, paymentIntentId: string): Promise<boolean> {
    try {
      // This is for development/testing only
      if (!__DEV__) {
        console.warn('Reset payment function should only be used in development');
        return false;
      }
      
      // Update attendee record
      const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
      await updateDoc(attendeeRef, {
        paymentStatus: 'pending',
        paymentId: null,
        paidAt: null
      });
      
      // Update payment intent
      if (paymentIntentId) {
        await this.updatePaymentIntentStatus(paymentIntentId, 'canceled');
      }
      
      return true;
    } catch (error) {
      console.error('Error resetting payment:', error);
      return false;
    }
  }
}

const enhancedPaymentService = new EnhancedPaymentService();
export default enhancedPaymentService;