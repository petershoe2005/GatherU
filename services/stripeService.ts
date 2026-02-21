import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = loadStripe(publishableKey);

export const createPaymentIntent = async (
  amountInCents: number,
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { amountInCents, metadata },
  });

  if (error) throw new Error(error.message || 'Failed to create payment intent');
  if (data?.error) throw new Error(data.error);

  return {
    clientSecret: data.clientSecret,
    paymentIntentId: data.paymentIntentId,
  };
};
