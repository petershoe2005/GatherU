import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { useAuth } from '../contexts/useAuth';
import {
  submitReview,
  createOrder,
  fetchOrderForItem,
  sellerConfirmDelivery,
  buyerConfirmDelivery,
  rejectDelivery,
} from '../services/ordersService';
import { releaseEscrow } from '../services/escrowService';

interface DeliveryConfirmationScreenProps {
  item: Item;
  onBack: () => void;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  'Product quality does not match description',
  'Item arrived damaged or broken',
  'Wrong item received',
  'Item looks different from photos',
  'Item was never delivered',
  'Other',
];

type Step = 'main' | 'reject_select' | 'reject_other' | 'seller_waiting' | 'rate' | 'done' | 'rejected_done';

const DeliveryConfirmationScreen: React.FC<DeliveryConfirmationScreenProps> = ({
  item,
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const isSeller = user?.id === (item.seller_id ?? item.seller.id);

  const [step, setStep] = useState<Step>('main');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [sellerAlreadyConfirmed, setSellerAlreadyConfirmed] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const order = await fetchOrderForItem(item.id, user.id);
      if (order) {
        setOrderId(order.id);
        setSellerAlreadyConfirmed(order.seller_confirmed);
        if (order.status === 'rejected') setStep('rejected_done');
        else if (order.status === 'rated') setStep('done');
        else if (order.status === 'delivered') setStep('rate');
        else if (isSeller && order.seller_confirmed) setStep('seller_waiting');
      }
      setLoading(false);
    };
    load();
  }, [item.id, user, isSeller]);

  const getOrCreateOrder = async (): Promise<string | null> => {
    if (orderId) return orderId;
    const sellerId = item.seller_id ?? item.seller.id;
    const order = await createOrder(item.id, user!.id, sellerId, item.currentBid);
    if (order) {
      setOrderId(order.id);
      return order.id;
    }
    return null;
  };

  const handleSellerConfirm = async () => {
    if (!user) return;
    setActionLoading(true);
    const oid = await getOrCreateOrder();
    if (oid) {
      await sellerConfirmDelivery(oid);
      setStep('seller_waiting');
    }
    setActionLoading(false);
  };

  const handleBuyerConfirm = async () => {
      if (!user) return;
      setActionLoading(true);
      const oid = await getOrCreateOrder();
      if (oid) {
        await buyerConfirmDelivery(oid);
        await releaseEscrow(item.id);
        setStep('rate');
      }
      setActionLoading(false);
    };

  const handleReject = async () => {
    if (!user || !selectedReason) return;
    const reason = selectedReason === 'Other' ? otherText || 'Other' : selectedReason;
    setActionLoading(true);
    const oid = await getOrCreateOrder();
    if (oid) {
      await rejectDelivery(oid, user.id, reason);
      setStep('rejected_done');
    }
    setActionLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!orderId || rating === 0) return;
    setActionLoading(true);
    await submitReview(orderId, rating, review);
    setActionLoading(false);
    setStep('done');
    setTimeout(onSuccess, 2000);
  };

  const platformFee = +(item.currentBid * 0.03).toFixed(2);
  const total = item.currentBid + platformFee;

  if (loading) {
    return (
      <div className="flex-1 bg-background-dark text-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background-dark text-white min-h-screen font-display flex flex-col">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center gap-4 shrink-0">
        <button
          onClick={step === 'reject_select' || step === 'reject_other' ? () => setStep('main') : onBack}
          className="p-2 rounded-full bg-surface-dark active:scale-90 transition-transform"
        >
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">
          {step === 'reject_select' || step === 'reject_other' ? 'Report a Problem' : 'Delivery Confirmation'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">

        {/* Item card — shown on main & seller_waiting steps */}
        {(step === 'main' || step === 'seller_waiting') && (
          <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 flex gap-4">
            <img className="w-20 h-20 rounded-xl object-cover shrink-0" src={item.images[0]} alt={item.title} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isSeller ? 'Buyer will confirm receipt' : `Seller: ${item.seller.name}`}
              </p>
              <p className="text-primary font-bold mt-2">${item.currentBid.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Order summary — buyer main step only */}
        {step === 'main' && !isSeller && (
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
        )}

        {/* ── SELLER: main ── */}
        {step === 'main' && isSeller && (
          <>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
              <span className="material-icons-round text-blue-400 mt-0.5 shrink-0">local_shipping</span>
              <div>
                <p className="text-sm font-bold text-blue-400">Seller Confirmation</p>
                <p className="text-xs text-slate-400 mt-1">
                  Confirm you have handed over / shipped the item. The buyer will then confirm receipt.
                </p>
              </div>
            </div>
            <button
              onClick={handleSellerConfirm}
              disabled={actionLoading}
              className="w-full bg-primary text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-icons-round text-lg">inventory_2</span>
                  I've Delivered the Item
                </>
              )}
            </button>
          </>
        )}

        {/* ── SELLER: waiting for buyer ── */}
        {step === 'seller_waiting' && (
          <div className="text-center py-10 space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-icons-round text-primary text-4xl">hourglass_top</span>
            </div>
            <h2 className="text-xl font-bold">Awaiting Buyer Confirmation</h2>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              You've confirmed delivery. Once the buyer confirms receipt, the transaction will be complete.
            </p>
            <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 text-left space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="material-icons-round text-primary text-base">check_circle</span>
                <span>Your delivery confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="material-icons-round text-slate-500 text-base">radio_button_unchecked</span>
                <span>Waiting for buyer confirmation</span>
              </div>
            </div>
          </div>
        )}

        {/* ── BUYER: main ── */}
        {step === 'main' && !isSeller && (
          <>
            {sellerAlreadyConfirmed && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 flex gap-2 items-center">
                <span className="material-icons-round text-green-400 text-base shrink-0">check_circle</span>
                <p className="text-xs text-green-400">Seller has already confirmed they delivered the item.</p>
              </div>
            )}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <span className="material-icons-round text-amber-500 mt-0.5 shrink-0">warning</span>
              <div>
                <p className="text-sm font-bold text-amber-500">Important</p>
                <p className="text-xs text-slate-400 mt-1">
                  Only confirm if you have physically received the item in satisfactory condition. This cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={handleBuyerConfirm}
              disabled={actionLoading}
              className="w-full bg-primary text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-icons-round text-lg">check_circle</span>
                  I've Received the Item
                </>
              )}
            </button>
            <button
              onClick={() => setStep('reject_select')}
              className="w-full bg-surface-dark border border-red-500/30 text-red-400 font-bold py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-lg">report_problem</span>
              Report a Problem
            </button>
          </>
        )}

        {/* ── REJECTION: select reason ── */}
        {step === 'reject_select' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Select the reason for rejecting this delivery:</p>
            {REJECTION_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => {
                  setSelectedReason(reason);
                  if (reason === 'Other') setStep('reject_other');
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium ${
                  selectedReason === reason
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-surface-dark border-border-dark text-white'
                }`}
              >
                {reason}
              </button>
            ))}
            {selectedReason && selectedReason !== 'Other' && (
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="w-full bg-red-500 text-white font-black py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-icons-round text-lg">cancel</span>
                    Confirm Rejection
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ── REJECTION: free-text ── */}
        {step === 'reject_other' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Please describe the issue:</p>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              className="w-full bg-surface-dark border border-border-dark rounded-2xl p-4 text-sm resize-none outline-none focus:border-red-400 text-white placeholder-slate-500 transition-colors"
              placeholder="Describe what went wrong..."
              rows={4}
              autoFocus
            />
            <button
              onClick={handleReject}
              disabled={actionLoading || !otherText.trim()}
              className="w-full bg-red-500 text-white font-black py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-icons-round text-lg">cancel</span>
                  Submit Rejection
                </>
              )}
            </button>
          </div>
        )}

        {/* ── BUYER: rate seller ── */}
        {step === 'rate' && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-primary text-3xl">star</span>
              </div>
              <h2 className="text-xl font-bold">Rate Your Experience</h2>
              <p className="text-sm text-slate-400 mt-2">How was your transaction with {item.seller.name}?</p>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 transition-all ${star <= rating ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <span className="material-icons text-3xl">{star <= rating ? 'star' : 'star_border'}</span>
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full bg-surface-dark border border-border-dark rounded-2xl p-4 text-sm resize-none outline-none focus:border-primary text-white placeholder-slate-500 transition-colors"
              placeholder="Share your experience (optional)..."
              rows={3}
            />
            <button
              onClick={handleSubmitRating}
              disabled={actionLoading || rating === 0}
              className="w-full bg-primary text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons-round text-primary text-4xl">celebration</span>
            </div>
            <h2 className="text-2xl font-black">Thank You!</h2>
            <p className="text-sm text-slate-400 mt-2">Your rating helps build a trusted community.</p>
          </div>
        )}

        {/* ── Rejected Done ── */}
        {step === 'rejected_done' && (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-icons-round text-red-400 text-4xl">report</span>
            </div>
            <h2 className="text-2xl font-black">Rejection Reported</h2>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Your concern has been recorded. Our support team will review the dispute and follow up with both parties.
            </p>
            <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 text-left">
              <p className="text-xs text-slate-400">
                <span className="font-bold text-white">What happens next: </span>
                Both the buyer and seller will be contacted by support within 24–48 hours.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full bg-surface-dark border border-border-dark text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-all"
            >
              Back to Listing
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DeliveryConfirmationScreen;
