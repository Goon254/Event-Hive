# Stripe Integration Guide

This document provides instructions for deploying and testing the Stripe payment integration for ScanGo.

## Overview

The Stripe integration consists of:

1. Firebase Cloud Functions for backend payment processing
2. Frontend components for payment UI
3. Webhook handling for payment events

## Firebase Cloud Functions

The following Firebase Functions have been implemented:

- `createPaymentIntent` - Creates a Stripe payment intent
- `getPaymentIntent` - Retrieves a payment intent by ID
- `stripeWebhook` - Handles Stripe webhook events
- `health` - Health check endpoint

## Deployment Instructions

### 1. Set Environment Variables

Before deploying, set the Stripe API keys as Firebase environment variables:

```bash
firebase functions:config:set stripe.secret_key="sk_test_51R9phj03PVcdX2kJ08IskdpVu8AojMr0eIgO1ds0Ur1mT2QAX9MG1XivE4jc4fhVQexi1T3SYOCkdAnOdGfbQm5S00a1jrZjlB"
```

For production, you'll need to set the live keys:

```bash
firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_KEY"
```

### 2. Deploy Firebase Functions

Deploy the Firebase Functions:

```bash
cd functions
npm run deploy
```

### 3. Set Up Stripe Webhook

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter the webhook URL: `https://us-central1-event-hive-992c0.cloudfunctions.net/stripeWebhook`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Set the webhook secret in Firebase:

```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

## Testing the Integration

### Test Cards

Use these test cards to test different payment scenarios:

- Successful payment: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Payment fails: `4000 0000 0000 0002`

### Testing Process

1. Navigate to an event page in the app
2. Select a ticket and proceed to checkout
3. Enter test card details
4. Complete the payment
5. Verify the payment status in the Stripe Dashboard
6. Check the Firestore database for updated payment records

## Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check that the Stripe secret key is correctly set
   - Verify that the Firebase Function is deployed

2. **Webhook Events Not Processing**
   - Verify the webhook URL is correct
   - Check that the webhook secret is correctly set
   - Use the Stripe CLI to test webhook delivery

3. **Payment UI Not Showing**
   - Check that the Stripe publishable key is correctly set in `lib/stripeConfig.ts`
   - Verify that the StripeProvider is correctly initialized

## Production Considerations

Before going live with the payment integration:

1. Replace test API keys with production keys
2. Set up proper error monitoring and logging
3. Implement additional security measures
4. Test the complete payment flow in a staging environment
5. Set up alerts for failed payments
6. Configure proper error handling and recovery mechanisms

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe React Native Documentation](https://github.com/stripe/stripe-react-native)