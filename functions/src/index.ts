import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51R9phj03PVcdX2kJ08IskdpVu8AojMr0eIgO1ds0Ur1mT2QAX9MG1XivE4jc4fhVQexi1T3SYOCkdAnOdGfbQm5S00a1jrZjlB';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil',
});

// Fee structure
const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee
const STRIPE_PERCENTAGE_FEE = 2.9; // 2.9% of transaction
const STRIPE_FIXED_FEE = 0.3; // $0.30 per transaction

/**
 * Create a payment intent
 */
export const createPaymentIntent = onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, eventId, attendeeId, description, metadata = {} } = req.body;

    if (!amount || !eventId || !attendeeId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Calculate fees
    const platformFee = Math.round(amountInCents * (PLATFORM_FEE_PERCENTAGE / 100));
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      description,
      metadata: {
        eventId,
        attendeeId,
        ...metadata,
      },
    });

    // Store payment intent in Firestore
    await admin.firestore().collection('paymentIntents').doc(paymentIntent.id).set({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amountInCents,
      description,
      eventId,
      attendeeId,
      status: paymentIntent.status,
      platformFee,
      metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return client secret to the client
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get payment intent by ID
 */
export const getPaymentIntent = onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  try {
    const id = req.path.split('/').pop();
    
    if (!id) {
      res.status(400).json({ error: 'Payment intent ID is required' });
      return;
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    
    res.status(200).json(paymentIntent);
  } catch (error) {
    logger.error('Error retrieving payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Handle Stripe webhook events
 */
export const stripeWebhook = onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    res.status(400).json({ error: 'Missing Stripe signature' });
    return;
  }

  try {
    // Get webhook secret from environment variables or use a default for development
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret';
    
    // Verify signature
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature.toString(),
      webhookSecret
    );
    
    logger.info(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      // Add more event handlers as needed
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook event:', error);
    res.status(500).json({ 
      error: 'Failed to handle webhook event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Handle successful payment
 */
const handlePaymentIntentSucceeded = async (paymentIntent: any) => {
  const { eventId, attendeeId } = paymentIntent.metadata;

  if (!eventId || !attendeeId) {
    logger.error('Missing eventId or attendeeId in payment intent metadata');
    return;
  }

  try {
    // Update payment intent status in Firestore
    await admin.firestore().collection('paymentIntents').doc(paymentIntent.id).update({
      status: 'succeeded',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update attendee record
    await admin.firestore().collection('events').doc(eventId)
      .collection('attendees').doc(attendeeId).update({
        paymentStatus: 'completed',
        paymentId: paymentIntent.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.info(`Payment succeeded for event ${eventId}, attendee ${attendeeId}`);
  } catch (error) {
    logger.error('Error updating payment records:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentIntentFailed = async (paymentIntent: any) => {
  const { eventId, attendeeId } = paymentIntent.metadata;

  if (!eventId || !attendeeId) {
    logger.error('Missing eventId or attendeeId in payment intent metadata');
    return;
  }

  try {
    // Update payment intent status in Firestore
    await admin.firestore().collection('paymentIntents').doc(paymentIntent.id).update({
      status: 'failed',
      lastError: paymentIntent.last_payment_error?.message || 'Unknown error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update attendee record
    await admin.firestore().collection('events').doc(eventId)
      .collection('attendees').doc(attendeeId).update({
        paymentStatus: 'failed',
        paymentError: paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.info(`Payment failed for event ${eventId}, attendee ${attendeeId}`);
  } catch (error) {
    logger.error('Error updating payment records:', error);
    throw error;
  }
};

// Health check endpoint
export const health = onRequest((req, res) => {
  res.status(200).send('OK');
});

// Log when the function is deployed
logger.info('Stripe payment API functions initialized');
