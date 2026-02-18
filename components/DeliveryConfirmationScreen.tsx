
import React, { useState } from 'react';
import { Item } from '../types';
import { useAuth } from '../contexts/useAuth';
import { confirmDelivery, submitReview, createOrder } from '../services/ordersService';

interface DeliveryConfirmationScreenProps {
  item: Item;
  onBack: () => void;
  onSuccess: () => void;
}

const DeliveryConfirmationScreen: React.FC<DeliveryConfirmationScreenProps> = ({ item, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'confirm' | 'rate' | 'done'>('confirm');
  const [isConfirming, setIsConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const platformFee = +(item.currentBid * 0.03).toFixed(2);
  const total = item.currentBid + platformFee;

  const handleConfirm = async () => {
    if (!user) return;
    setIsConfirming(true);

    // Create order and confirm delivery
    const order = await createOrder(
      item.id,
      user.id,
      item.seller_id || item.seller.id,
      item.currentBid
    );

    if (order) {
      setOrderId(order.id);
      await confirmDelivery(order.id);
      setStep('rate');
    }
    setIsConfirming(false);
  };

  const handleSubmitRating = async () => {
    if (!orderId || rating === 0) return;
    setIsSubmitting(true);

    await submitReview(orderId, rating, review);

    setIsSubmitting(false);
    setStep('done');
    setTimeout(onSuccess, 2000);
  };

  return (
    <div className="flex-1 bg-background-dark text-white min-h-screen font-display flex flex-col">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full bg-surface-dark active:scale-90 transition-transform">
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Delivery Confirmation</h1>
      </header>

      <div className="flex-1 px-4 pb-8">
        {step === 'confirm' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Item Summary */}
            <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 flex gap-4">
              <img className="w-20 h-20 rounded-xl object-cover" src={item.images[0]} alt={item.title} />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Seller: {item.seller.name}</p>
                <p className="text-primary font-bold mt-2">${item.currentBid.toFixed(2)}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Winning Bid</span>
                <span className="font-semibold">${item.currentBid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Platform Fee (3%)</span>
                <span className="font-semibold">${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border-dark pt-3 flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="font-black text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <span className="material-icons-round text-amber-500 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-bold text-amber-500">Important</p>
                <p className="text-xs text-slate-400 mt-1">By confirming, you acknowledge that you have received the item in satisfactory condition. This action cannot be undone.</p>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full bg-primary text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isConfirming ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-icons-round text-lg">check_circle</span>
                  Confirm Delivery
                </>
              )}
            </button>
          </div>
        )}

        {step === 'rate' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-primary text-3xl">star</span>
              </div>
              <h2 className="text-xl font-bold">Rate Your Experience</h2>
              <p className="text-sm text-slate-400 mt-2">How was your transaction with {item.seller.name}?</p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 transition-all ${star <= rating ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <span className="material-icons text-3xl">{star <= rating ? 'star' : 'star_border'}</span>
                </button>
              ))}
            </div>

            {/* Review */}
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full bg-surface-dark border border-border-dark rounded-2xl p-4 text-sm resize-none outline-none focus:border-primary text-white placeholder-slate-500 transition-colors"
              placeholder="Share your experience (optional)..."
              rows={3}
            ></textarea>

            <button
              onClick={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
              className="w-full bg-primary text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons-round text-primary text-4xl">celebration</span>
            </div>
            <h2 className="text-2xl font-black">Thank You!</h2>
            <p className="text-sm text-slate-400 mt-2">Your rating helps build a trusted community.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryConfirmationScreen;
