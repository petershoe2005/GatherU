
import React, { useState, useEffect, useCallback } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabase';
import { updateSettings } from '../services/profileService';
import { stripePromise } from '../services/stripeService';

interface PaymentMethodsScreenProps {
  onBack: () => void;
}

// --- Add Card Modal (uses Stripe Elements) ---
const AddCardForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !user) return;
    setLoading(true);
    setError(null);

    try {
        const { data, error: fnErr } = await supabase.functions.invoke('create-setup-intent', {});
      if (fnErr || !data?.clientSecret) throw new Error(fnErr?.message ?? 'Failed to create setup intent');

      const result = await stripe.confirmCardSetup(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (result.error) throw new Error(result.error.message);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#f1f5f9',
        fontFamily: '"Inter", sans-serif',
        fontSize: '16px',
        '::placeholder': { color: '#64748b' },
      },
      invalid: { color: '#f87171' },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface-dark border border-slate-700 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Add Payment Method</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <CardElement options={cardStyle} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="material-icons-round animate-spin text-base">sync</span> Saving...</>
            ) : (
              <><span className="material-icons-round text-base">lock</span> Save Card Securely</>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Card details are encrypted and stored by Stripe. GatherU never sees your card number.
          </p>
        </form>
      </div>
    </div>
  );
};

// --- Main Screen ---
const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ onBack }) => {
  const { profile, user, refreshProfile } = useAuth();
  const [acceptCash, setAcceptCash] = useState(profile?.accept_cash ?? true);

  // Balance state
  const [balance, setBalance] = useState<{ available: number; pending: number; currency: string; connected: boolean } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);

  // UI state
  const [showAddCard, setShowAddCard] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    try {
      const { data } = await supabase.functions.invoke('get-stripe-balance');
      if (data) setBalance(data);
    } catch { /* silent */ } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user) return;
    setMethodsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('list-payment-methods');
      if (data?.methods) setPaymentMethods(data.methods);
    } catch { /* silent */ } finally {
      setMethodsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
    fetchPaymentMethods();
  }, [fetchBalance, fetchPaymentMethods]);

  const handleToggleCash = async () => {
    const newVal = !acceptCash;
    setAcceptCash(newVal);
    if (profile) {
      await updateSettings(profile.id, { accept_cash: newVal });
      await refreshProfile();
    }
  };

  const handleRequestPayout = async () => {
    if (!user || !balance?.connected) return;
    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('request-payout');
      if (error || data?.error) {
        setPayoutMessage(data?.error ?? error?.message ?? 'Payout failed');
      } else {
        setPayoutMessage('Payout initiated! Funds will arrive within 1–2 business days.');
        fetchBalance();
      }
    } catch (err: any) {
      setPayoutMessage(err.message);
    } finally {
      setPayoutLoading(false);
      setTimeout(() => setPayoutMessage(null), 6000);
    }
  };

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: {
          return_url: window.location.href,
          refresh_url: window.location.href,
        },
      });
      if (error || !data?.url) throw new Error(error?.message ?? 'Failed to create onboarding link');
      window.open(data.url, '_blank');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const formatBalance = (cents: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

  const cardBrand = (brand: string) => {
    const brands: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };
    return brands[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <>
      {showAddCard && (
        <Elements stripe={stripePromise}>
          <AddCardForm
            onSuccess={() => { setShowAddCard(false); fetchPaymentMethods(); }}
            onCancel={() => setShowAddCard(false)}
          />
        </Elements>
      )}

      <div className="flex-1 bg-background-dark text-slate-100 min-h-screen font-display">
        <header className="px-6 py-4 flex items-center gap-4 mt-8">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dark transition-colors active:scale-90">
            <span className="material-icons-round text-slate-300">chevron_left</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Payments & Payouts</h1>
        </header>

        <main className="flex-1 px-6 py-4 space-y-8 overflow-y-auto pb-24">

          {/* Payouts */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payouts</h2>
            <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
              {balanceLoading ? (
                <div className="py-4 flex flex-col items-center gap-2">
                  <span className="material-icons-round animate-spin text-primary text-3xl">sync</span>
                  <p className="text-slate-400 text-sm">Loading balance...</p>
                </div>
              ) : balance?.connected ? (
                <>
                  <span className="text-sm text-slate-400 font-medium">Available Balance</span>
                  <div className="text-4xl font-bold mt-1 text-primary">
                    {formatBalance(balance.available, balance.currency)}
                  </div>
                  {balance.pending > 0 && (
                    <p className="text-[12px] text-slate-500 mt-1">
                      {formatBalance(balance.pending, balance.currency)} pending
                    </p>
                  )}
                  <p className="text-[12px] text-slate-500 mt-2">Ready for transfer to your bank</p>
                  {payoutMessage && (
                    <p className={`text-sm mt-3 font-medium ${payoutMessage.includes('initiated') ? 'text-green-400' : 'text-red-400'}`}>
                      {payoutMessage}
                    </p>
                  )}
                  <button
                    onClick={handleRequestPayout}
                    disabled={payoutLoading || balance.available === 0}
                    className="mt-6 w-full py-3.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    <span className="material-icons-round text-lg">{payoutLoading ? 'sync' : 'account_balance_wallet'}</span>
                    {payoutLoading ? 'Processing...' : 'Request Payout'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                    <span className="material-icons-round text-blue-400 text-3xl">account_balance</span>
                  </div>
                  <p className="font-semibold text-white">Connect Stripe to receive payouts</p>
                  <p className="text-[12px] text-slate-400 mt-1 max-w-xs">
                    Link your bank account via Stripe Connect to receive payments from your sales.
                  </p>
                  <button
                    onClick={handleConnectStripe}
                    disabled={connectLoading}
                    className="mt-6 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-icons-round text-lg">{connectLoading ? 'sync' : 'link'}</span>
                    {connectLoading ? 'Opening...' : 'Connect with Stripe'}
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Payment Methods */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Methods</h2>
            <div className="bg-surface-dark border border-slate-800 rounded-2xl divide-y divide-slate-800">
              {methodsLoading ? (
                <div className="p-6 flex items-center justify-center gap-2 text-slate-400">
                  <span className="material-icons-round animate-spin text-primary">sync</span>
                  <span className="text-sm">Loading cards...</span>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No saved cards yet.</div>
              ) : (
                paymentMethods.map((pm, i) => (
                  <div key={pm.id} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-primary">
                      <span className="material-icons-round">credit_card</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white leading-tight">
                          {cardBrand(pm.card.brand)} ending in {pm.card.last4}
                        </p>
                        {i === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold rounded-md uppercase">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Expires {String(pm.card.exp_month).padStart(2, '0')}/{String(pm.card.exp_year).slice(-2)}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Stripe Connect status row */}
              <div
                onClick={!balance?.connected ? handleConnectStripe : undefined}
                className={`p-4 flex items-center gap-4 transition-opacity ${!balance?.connected ? 'cursor-pointer active:opacity-70' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${balance?.connected ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}>
                  <span className="material-icons-round text-2xl">account_balance</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white leading-tight">
                    {balance?.connected ? 'Stripe Connected' : 'Stripe Not Connected'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {balance?.connected ? 'Instant payouts enabled' : 'Tap to connect your bank account'}
                  </p>
                </div>
                {balance?.connected ? (
                  <span className="material-icons-round text-green-400 text-xl">check_circle</span>
                ) : (
                  <span className="material-icons-round text-slate-600">chevron_right</span>
                )}
              </div>

              <button
                onClick={() => setShowAddCard(true)}
                className="w-full p-4 flex items-center gap-4 text-primary font-medium hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <span className="material-icons-round">add</span>
                </div>
                <span>Add New Payment Method</span>
              </button>
            </div>
          </section>

          {/* Selling Preferences */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Selling Preferences</h2>
            <div className="bg-surface-dark border border-slate-800 rounded-2xl">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <span className="material-icons-round">payments</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white leading-tight">Accept Cash on Delivery</p>
                    <p className="text-xs text-slate-400 mt-0.5">For local campus meetups</p>
                  </div>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      checked={acceptCash}
                      onChange={handleToggleCash}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-12 h-7 bg-slate-700 rounded-full transition-colors peer-checked:bg-primary"></div>
                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${acceptCash ? 'translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
            <p className="px-4 text-[11px] text-slate-500 leading-relaxed italic">
              Note: Cash on Delivery transactions are not protected by GatherU's standard buyer/seller protection.
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default PaymentMethodsScreen;
