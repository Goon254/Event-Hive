// app/services/paymentService.ts
import { Alert } from 'react-native';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import Constants from 'expo-constants';

// Your server-side API endpoint for secure Stripe operations
// This should be your own backend server that handles Stripe securely
const BACKEND_API_URL = 'https://your-backend-api.com';

// Stripe configuration
const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee

class PaymentService {
  // Calculate fees for displaying to users
  calculateFeesForDisplay(ticketPrice: number) {
    // Convert to cents for precise calculation
    const priceInCents = Math.round(ticketPrice * 100);
    const platformFee = Math.round(priceInCents * (PLATFORM_FEE_PERCENTAGE / 100));
    const stripeFee = Math.round(priceInCents * 0.029 + 30); // 2.9% + $0.30
    const creatorReceives = priceInCents - platformFee - stripeFee;
    
    return {
      totalPrice: priceInCents / 100,
      stripeFee: stripeFee / 100,
      platformFee: platformFee / 100,
      creatorReceives: creatorReceives / 100
    };
  }

  // Process ticket payment using a secure backend
  async processTicketPayment(
    eventId: string,
    attendeeId: string,
    amount: number, // in cents
    eventCreatorStripeId: string,
    description: string
  ) {
    try {
      console.log(`Processing payment for event ${eventId}, attendee ${attendeeId}`);
      
      // Make a secure call to your backend
      const response = await fetch(`${BACKEND_API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          eventId,
          attendeeId,
          eventCreatorStripeId,
          description
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }
      
      const result = await response.json();
      
      // Store payment record in Firestore
      await setDoc(doc(db, "payments", result.paymentIntentId), {
        eventId,
        attendeeId,
        amount,
        creatorStripeId: eventCreatorStripeId,
        description,
        createdAt: new Date(),
        platformFeeAmount: Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100)),
        status: 'pending'
      });
      
      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      
      // If in dev mode and backend isn't available, use simulation
      if (__DEV__) {
        console.log("DEV MODE: Using simulated payment intent");
        const simulatedPaymentIntentId = `pi_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // Store a record in Firestore for the payment
        await setDoc(doc(db, "payments", simulatedPaymentIntentId), {
          eventId,
          attendeeId,
          amount,
          creatorStripeId: eventCreatorStripeId,
          description,
          createdAt: new Date(),
          platformFeeAmount: Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100)),
          status: 'pending',
          simulated: true
        });
        
        return {
          clientSecret: `seti_${simulatedPaymentIntentId}_secret_${Math.floor(Math.random() * 10000)}`,
          paymentIntentId: simulatedPaymentIntentId
        };
      }
      
      if (error instanceof Error) {
        throw new Error(`Payment processing failed: ${error.message}`);
      }
      throw new Error('Payment processing failed');
    }
  }

  // Update attendee after successful payment
  async confirmAttendeePayment(
    eventId: string,
    attendeeId: string,
    paymentIntentId: string
  ) {
    try {
      console.log(`Confirming payment for event ${eventId}, attendee ${attendeeId}`);
      
      // Update attendee record
      const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
      await updateDoc(attendeeRef, {
        paymentStatus: 'completed',
        paymentId: paymentIntentId,
        paidAt: new Date()
      });
      
      // Update payment record
      const paymentRef = doc(db, "payments", paymentIntentId);
      await updateDoc(paymentRef, {
        status: 'completed',
        completedAt: new Date()
      });
      
      console.log("Payment confirmed successfully");
      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  }

  // Function for event creators to connect Stripe account
  async createConnectAccount(userId: string, email: string, name: string) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/create-connect-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          name
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create connect account');
      }
      
      const result = await response.json();
      return result.accountLinkUrl;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      
      // For development purposes, simulate a successful response
      if (__DEV__) {
        console.log("DEV MODE: Simulating Stripe Connect account");
        return 'https://connect.stripe.com/setup/s/acct_example';
      }
      
      throw new Error('Failed to set up payment processing account');
    }
  }

  // Function to check if creator has connected their Stripe account
  async hasConnectedStripeAccount(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();
      return !!(userData?.stripeAccountId && userData?.stripeOnboardingComplete);
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
      return false;
    }
  }

  // For testing/demonstration purposes only (use only in development)
  async simulateStripeAccountConnection(userId: string) {
    if (!__DEV__) {
      console.warn('Stripe account simulation only available in development mode');
      return false;
    }
    
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        stripeAccountId: `acct_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        stripeOnboardingComplete: true
      });
      return true;
    } catch (error) {
      console.error('Error simulating Stripe connection:', error);
      return false;
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;