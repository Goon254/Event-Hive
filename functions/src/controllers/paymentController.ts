import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import stripe from '../config/stripeConfig';

// Fee structure
const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee
const STRIPE_PERCENTAGE_FEE = 2.9; // 2.9% of transaction
const STRIPE_FIXED_FEE = 0.3; // $0.30 per transaction

/**
 * Create a payment intent
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, eventId, attendeeId, description, metadata = {} } = req.body;

    if (!amount || !eventId || !attendeeId) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get payment intent by ID
 */
export const getPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    
    return res.status(200).json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};