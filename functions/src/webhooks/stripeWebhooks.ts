import { Request, Response } from 'express';
import * as admin from 'firebase-admin';

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = req.body;

  try {
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      // Add more event handlers as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return res.status(500).json({ 
      error: 'Failed to handle webhook event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle successful payment
 */
const handlePaymentIntentSucceeded = async (paymentIntent: any) => {
  const { eventId, attendeeId } = paymentIntent.metadata;

  if (!eventId || !attendeeId) {
    console.error('Missing eventId or attendeeId in payment intent metadata');
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

    console.log(`Payment succeeded for event ${eventId}, attendee ${attendeeId}`);
  } catch (error) {
    console.error('Error updating payment records:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentIntentFailed = async (paymentIntent: any) => {
  const { eventId, attendeeId } = paymentIntent.metadata;

  if (!eventId || !attendeeId) {
    console.error('Missing eventId or attendeeId in payment intent metadata');
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

    console.log(`Payment failed for event ${eventId}, attendee ${attendeeId}`);
  } catch (error) {
    console.error('Error updating payment records:', error);
    throw error;
  }
};