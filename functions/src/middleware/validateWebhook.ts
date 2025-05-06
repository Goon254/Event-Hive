import { Request, Response, NextFunction } from 'express';
import * as functions from 'firebase-functions';
import stripe from '../config/stripeConfig';

/**
 * Validate Stripe webhook signature
 */
export const validateWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    // Get raw body from request
    const rawBody = req.rawBody;
    
    // Get webhook secret from environment variables or use a default for development
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret';
    
    // Verify signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature.toString(),
      webhookSecret
    );
    
    // Add the verified event to the request object
    req.body = event;
    
    next();
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).json({ 
      error: 'Webhook signature verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};