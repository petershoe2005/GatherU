import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BOOST_OPTIONS = [
  { days: 1, price: 199, label: '1 Day', tag: 'Quick boost' },
  { days: 3, price: 399, label: '3 Days', tag: 'Most popular', highlight: true },
  { days: 7, price: 799, label: '7 Days', tag: 'Best value' },
];

interface BoostFormProps {
  itemId: string;
  itemTitle: string;
  sellerId: string;
  onSuccess: () => void;
  onClose: () => void;
}

const BoostForm: React.FC<BoostFormProps> = ({ itemId, itemTitle, sellerId, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [selected, setSelected] = useState(1); // index into BOOST_OPTIONS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const option = BOOST_OPTIONS[selected];

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      // Create payment intent server-side via Stripe API
      const sk = import.meta.env.VITE_STRIPE_SECRET_KEY;
      const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sk}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(option.price),
          currency: 'usd',
          'metadata[item_id]': itemId,
          'metadata[boost_days]': String(option.days),
        }),
      });

      const text = await piRes.text();
      const pi = text ? JSON.parse(text) : {};
      if (!pi.client_secret) throw new Error(pi.error?.message || 'Payment setup failed');

      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(pi.client_secret, {
        payment_method: { card },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment did not succeed');

      // Mark item as boosted
      const expiresAt = new Date(Date.now() + option.days * 86400000).toISOString();
      await supabase
        .from('items')
        .update({ is_boosted: true, boost_expires_at: expiresAt })
        .eq('id', itemId);

      // Record boost transaction
      await supabase.from('boost_transactions').insert({
        item_id: itemId,
        seller_id: sellerId,
        payment_intent_id: paymentIntent.id,
        amount_cents: option.price,
        duration_days: option.days,
        expires_at: expiresAt,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Item */}
      <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="material-icons-round text-primary text-sm">rocket_launch</span>
        </div>
        <div>
          <p className="text-xs text-slate-400">Boosting listing</p>
          <p className="text-sm font-bold text-white truncate max-w-[220px]">{itemTitle}</p>
        </div>
      </div>

      {/* Duration selector */}
      <div className="grid grid-cols-3 gap-2">
        {BOOST_OPTIONS.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`relative rounded-xl p-3 border text-center transition-all ${
              selected === i
                ? 'border-primary bg-primary/10'
                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
            }`}
          >
            {opt.highlight && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                Popular
              </div>
            )}
            <div className="text-white font-black text-base">{opt.label}</div>
            <div className={`text-xs font-bold mt-0.5 ${selected === i ? 'text-primary' : 'text-slate-400'}`}>
              ${(opt.price / 100).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{opt.tag}</div>
          </button>
        ))}
      </div>

      {/* What you get */}
      <div className="bg-slate-800/50 rounded-xl p-3 space-y-1.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">What you get</p>
        {[
          'Pinned at the top of the feed',
          '"Boosted" badge on your listing',
          'Shown in the Sponsored section',
          `Lasts ${option.days} day${option.days > 1 ? 's' : ''}`,
        ].map((feat, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="material-icons-round text-primary text-sm">check_circle</span>
            <span className="text-xs text-slate-300">{feat}</span>
          </div>
        ))}
      </div>

      {/* Card input */}
      <div className="bg-slate-800 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Card Details</p>
        <CardElement options={{
          style: {
            base: { color: '#f1f5f9', fontSize: '15px', '::placeholder': { color: '#64748b' } },
          },
        }} />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">{error}</div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || !stripe}
        className="w-full bg-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : (
          <>
            <span className="material-icons-round text-sm">rocket_launch</span>
            Boost for ${(option.price / 100).toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
};

interface BoostModalProps {
  itemId: string;
  itemTitle: string;
  sellerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const BoostModal: React.FC<BoostModalProps> = (props) => {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 rounded-t-3xl w-full max-w-md p-6 text-center space-y-4 pb-10">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <span className="material-icons-round text-primary text-3xl">rocket_launch</span>
          </div>
          <h2 className="text-xl font-black text-white">Listing Boosted!</h2>
          <p className="text-sm text-slate-400">Your listing is now pinned at the top of the feed.</p>
          <button onClick={props.onClose} className="w-full bg-primary text-black font-black py-4 rounded-xl">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-t-3xl w-full max-w-md p-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="material-icons-round text-primary">rocket_launch</span>
            Boost Listing
          </h2>
          <button onClick={props.onClose} className="text-slate-400 hover:text-white">
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <Elements stripe={stripePromise}>
          <BoostForm
            {...props}
            onSuccess={() => { setDone(true); props.onSuccess(); }}
          />
        </Elements>
      </div>
    </div>
  );
};

export default BoostModal;
