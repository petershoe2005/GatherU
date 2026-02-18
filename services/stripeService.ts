import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;

export const stripePromise = loadStripe(publishableKey);

export const createPaymentIntent = async (
  amountInCents: number,
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  const body = new URLSearchParams();
  body.append('amount', amountInCents.toString());
  body.append('currency', 'usd');
  body.append('automatic_payment_methods[enabled]', 'true');

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      body.append(`metadata[${key}]`, value);
    });
  }

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create payment intent');
  }

  const data = await response.json();
  return {
    clientSecret: data.client_secret,
    paymentIntentId: data.id,
  };
};
