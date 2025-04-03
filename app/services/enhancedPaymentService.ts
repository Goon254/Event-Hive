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
import { PAYMENT_API_URL } from '../../lib/stripeConfig';

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
   * Process ticket payment - creates a payment intent
   * In a real app, this would call your backend
   */
  async processTicketPayment(
    eventId: string,
    attendeeId: string,
    amount: number, // in dollars
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<{ clientSecret: string, paymentIntentId: string }> {
    try {
      console.log(`Processing payment for event ${eventId}, attendee ${attendeeId}`);
      
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      
      // In a production app, we'd call a backend service to create a payment intent
      // For this demo, we'll create a mock payment intent in Firestore
      
      // Option 1: Call an actual backend service
      /*
      const response = await fetch(PAYMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          eventId,
          attendeeId,
          description,
          metadata
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Payment service error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.id
      };
      */
      
      // Option 2: For demo purposes, create a mock payment intent in Firestore
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 8)}`;
      
      // Calculate fees
      const fees = this.calculateFeesForDisplay(amount);
      
      // Store payment intent in Firestore
      const paymentData = {
        id: paymentIntentId,
        clientSecret,
        amount: amountInCents,
        description,
        eventId,
        attendeeId,
        status: 'requires_payment_method',
        platformFee: Math.round(fees.platformFee * 100),
        stripeFee: Math.round(fees.stripeFee * 100),
        amountNet: Math.round(fees.creatorReceives * 100),
        metadata,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, "paymentIntents", paymentIntentId), paymentData);
      
      console.log(`Created payment intent with ID: ${paymentIntentId}`);
      
      return {
        clientSecret,
        paymentIntentId
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update payment intent status in Firestore
   */
  async updatePaymentIntentStatus(
    paymentIntentId: string,
    status: string
  ): Promise<void> {
    try {
      const paymentRef = doc(db, "paymentIntents", paymentIntentId);
      await updateDoc(paymentRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating payment intent status:', error);
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
    try {
      console.log(`Confirming payment for event ${eventId}, attendee ${attendeeId}`);
      
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