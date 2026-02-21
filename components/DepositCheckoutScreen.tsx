import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Item } from '../types';
import { useAuth } from '../contexts/useAuth';
import { stripePromise, createPaymentIntent } from '../services/stripeService';
import { createEscrowTransaction } from '../services/escrowService';

interface DepositCheckoutScreenProps {
  item: Item;
  onBack: () => void;
  onSuccess: () => void;
}

const PLATFORM_FEE_RATE = 0.02;

const DepositCheckoutForm: React.FC<DepositCheckoutScreenProps> = ({ item, onBack, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const depositPct = item.deposit_percentage || 10;
  const fullPrice = item.currentBid;
  const depositAmount = +(fullPrice * (depositPct / 100)).toFixed(2);
  const platformFee = +(depositAmount * PLATFORM_FEE_RATE).toFixed(2);
  const total = +(depositAmount + platformFee).toFixed(2);
  const totalCents = Math.round(total * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent(totalCents, {
        item_id: item.id,
        buyer_id: user.id,
        seller_id: item.seller_id || '',
        type: 'deposit',
        deposit_percentage: String(depositPct),
      });

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await createEscrowTransaction({
          item_id: item.id,
          buyer_id: user.id,
          seller_id: item.seller_id || item.seller.id,
          payment_intent_id: paymentIntentId,
          deposit_amount: depositAmount,
          full_price: fullPrice,
          deposit_percentage: depositPct,
        });
        setSucceeded(true);
        setTimeout(() => onSuccess(), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (succeeded) {
    return (
      <div className="flex-1 bg-background-dark min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <span className="material-icons-round text-primary text-4xl">account_balance</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Deposit Paid!</h2>
        <p className="text-slate-400 text-sm">Funds held securely by GatherU</p>
        <p className="text-slate-500 text-xs mt-2">
          Your <span className="text-primary font-bold">${depositAmount.toFixed(2)}</span> deposit for <span className="text-white font-semibold">{item.title}</span> is protected until delivery is confirmed.
        </p>
        <div className="mt-6 bg-surface-dark border border-border-dark rounded-2xl p-4 w-full max-w-xs space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-icons-round text-primary text-base">check_circle</span>
            <span className="text-slate-300">Deposit secured</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-icons-round text-slate-600 text-base">radio_button_unchecked</span>
            <span>Awaiting delivery confirmation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-icons-round text-slate-600 text-base">radio_button_unchecked</span>
            <span>Funds released to seller</span>
          </div>
        </div>
        <p className="text-slate-600 text-xs mt-6">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background-dark min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onBack} className="bg-surface-dark text-white p-2.5 rounded-full active:scale-90 transition-transform border border-slate-700">
          <span className="material-icons-round text-lg">arrow_back</span>
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Pay Deposit</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Escrow Payment</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-36">
        <div className="bg-surface-dark border border-slate-700 rounded-2xl p-4 mb-4 flex items-center gap-4">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-16 h-16 rounded-xl object-cover border border-slate-600"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{item.title}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{item.seller.name} · {item.seller.institution}</p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex gap-3">
          <span className="material-icons-round text-primary mt-0.5 shrink-0">shield</span>
          <div>
            <p className="text-sm font-bold text-primary">Buyer Protection</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Your deposit is held securely by GatherU. Funds are only released to the seller once you confirm delivery. If the seller backs out, you get a full refund.
            </p>
          </div>
        </div>

        <div className="bg-surface-dark border border-slate-700 rounded-2xl p-4 mb-4 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Winning Bid</span>
            <span className="text-white font-bold">${fullPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Deposit ({depositPct}%)</span>
            <span className="text-primary font-bold">${depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Platform Fee (2%)</span>
            <span className="text-white font-bold">${platformFee.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-600 pt-3 flex justify-between">
            <span className="text-white font-black">Total Due Now</span>
            <span className="text-primary font-black text-lg">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Remaining balance at delivery</span>
            <span>${(fullPrice - depositAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-surface-dark border border-slate-700 rounded-2xl p-4 mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Payment Details</h3>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-600">
            <CardElement
              onChange={(e) => setCardComplete(e.complete)}
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#e2e8f0',
                    fontFamily: '"Spline Sans", sans-serif',
                    '::placeholder': { color: '#64748b' },
                    iconColor: '#FF6B00',
                  },
                  invalid: { color: '#ef4444', iconColor: '#ef4444' },
                },
              }}
            />
          </div>
          <p className="text-slate-500 text-[10px] mt-3 flex items-center gap-1">
            <span className="material-icons-round text-xs">lock</span>
            Secured by Stripe · Test mode
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 flex gap-3">
          <span className="material-icons-round text-amber-500 mt-0.5 shrink-0">info</span>
          <div className="space-y-1">
            <p className="text-xs text-amber-400 font-bold">Deposit Terms</p>
            <p className="text-[11px] text-slate-400">If you back out of this purchase, the deposit is forfeited to the seller. If the seller fails to deliver, you receive a full refund.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="material-icons-round text-red-400 text-sm">error</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background-dark/95 backdrop-blur-xl border-t border-slate-700 p-4 z-40">
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe || !cardComplete}
          className="w-full bg-primary hover:bg-primary-light text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="material-icons-round text-sm">account_balance</span>
              Pay Deposit ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const DepositCheckoutScreen: React.FC<DepositCheckoutScreenProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <DepositCheckoutForm {...props} />
    </Elements>
  );
};

export default DepositCheckoutScreen;
