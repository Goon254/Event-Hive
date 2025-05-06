import * as functions from 'firebase-functions';
import Stripe from 'stripe';

// Get Stripe API key from environment variables or use the provided key for development
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51R9phj03PVcdX2kJ08IskdpVu8AojMr0eIgO1ds0Ur1mT2QAX9MG1XivE4jc4fhVQexi1T3SYOCkdAnOdGfbQm5S00a1jrZjlB';

// Initialize Stripe
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil', // Use the latest API version
});

export default stripe;