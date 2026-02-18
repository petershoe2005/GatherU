
import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { updateSettings } from '../services/profileService';

interface PaymentMethodsScreenProps {
  onBack: () => void;
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ onBack }) => {
  const { profile, refreshProfile } = useAuth();
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [acceptCash, setAcceptCash] = useState(profile?.accept_cash ?? true);

  const handleToggleCash = async () => {
    const newVal = !acceptCash;
    setAcceptCash(newVal);
    if (profile) {
      await updateSettings(profile.id, { accept_cash: newVal });
      await refreshProfile();
    }
  };

  return (
    <div className="flex-1 bg-background-dark text-slate-100 min-h-screen font-display">
      <header className="px-6 py-4 flex items-center gap-4 mt-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dark transition-colors active:scale-90">
          <span className="material-icons-round text-slate-300">chevron_left</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Payments & Payouts</h1>
      </header>

      <main className="flex-1 px-6 py-4 space-y-8 overflow-y-auto pb-24">
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payouts</h2>
          <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
            <span className="text-sm text-slate-400 font-medium">Available Balance</span>
            <div className="text-4xl font-bold mt-1 text-primary">$142.50</div>
            <p className="text-[12px] text-slate-500 mt-2">Ready for transfer to your bank</p>
            <button
              onClick={() => {
                setPayoutRequested(true);
                setTimeout(() => setPayoutRequested(false), 3000);
              }}
              className="mt-6 w-full py-3.5 bg-primary hover:bg-teal-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <span className="material-icons-round text-lg">account_balance_wallet</span>
              {payoutRequested ? 'Requesting...' : 'Request Payout'}
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Payment Methods</h2>
          </div>
          <div className="bg-surface-dark border border-slate-800 rounded-2xl divide-y divide-slate-800">
            <div className="p-4 flex items-center gap-4 group cursor-pointer active:opacity-70 transition-opacity">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-primary">
                <span className="material-icons-round">credit_card</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white leading-tight">Visa Ending in 4242</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold rounded-md uppercase">Primary</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Expires 12/26</p>
              </div>
              <span className="material-icons-round text-slate-600">chevron_right</span>
            </div>
            <div className="p-4 flex items-center gap-4 group cursor-pointer active:opacity-70 transition-opacity">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <span className="material-icons-round text-2xl">account_balance</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white leading-tight">Stripe Connected</p>
                <p className="text-xs text-slate-400 mt-0.5">Instant payouts enabled</p>
              </div>
              <span className="material-icons-round text-slate-600">chevron_right</span>
            </div>
            <button className="w-full p-4 flex items-center gap-4 text-primary font-medium hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                <span className="material-icons-round">add</span>
              </div>
              <span>Add New Payment Method</span>
            </button>
          </div>
        </section>

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
  );
};

export default PaymentMethodsScreen;
