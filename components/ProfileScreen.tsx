
import React, { useState, useEffect } from 'react';
import { AppScreen } from '../types';
import { useAuth } from '../contexts/useAuth';
import { fetchProfileStats } from '../services/profileService';
import BottomNav from './BottomNav';

interface ProfileScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({ itemsSold: 0, activeBids: 0, rating: 0 });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchProfileStats(profile.id).then(setStats);
    }
  }, [profile]);

  const confirmLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    onNavigate(AppScreen.LOGIN);
  };

  const menuItems = [
    { screen: AppScreen.MY_LISTINGS, icon: 'inventory_2', label: 'My Listings', desc: 'Manage your active listings', color: 'bg-orange-50 text-primary' },
    { screen: AppScreen.FAVORITES, icon: 'favorite', label: 'Favorites', desc: 'Items you saved', color: 'bg-rose-50 text-rose-500' },
    { screen: AppScreen.PURCHASE_HISTORY, icon: 'receipt_long', label: 'Purchase History', desc: 'View past transactions', color: 'bg-amber-50 text-amber-500' },
    { screen: AppScreen.PAYMENT_METHODS, icon: 'account_balance_wallet', label: 'Payments & Payouts', desc: 'Manage payment methods', color: 'bg-blue-50 text-blue-500' },
    { screen: AppScreen.ACCOUNT_SETTINGS, icon: 'settings', label: 'Account Settings', desc: 'Privacy, notifications, security', color: 'bg-slate-100 text-slate-500' },
  ];

  return (
    <div className="flex-1 bg-slate-50 pb-24 font-display">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-secondary to-slate-800 pt-14 pb-24 px-6 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top row: edit button */}
         <div className="flex justify-end mb-4">
           <button
             onClick={() => onNavigate(AppScreen.ACCOUNT_SETTINGS)}
             className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
           >
             <span className="material-icons-round text-[14px]">edit</span>
             Edit Profile
           </button>
         </div>

         {/* Centered avatar + info */}
         <div className="flex flex-col items-center text-center">
           <div className="relative mb-3">
             <img
               className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
               src={profile?.avatar_url || 'https://picsum.photos/seed/profile/200/200'}
               alt={profile?.name}
             />
             {profile?.is_verified && (
               <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
                 <span className="material-icons text-white text-[14px] font-bold">check</span>
               </div>
             )}
           </div>

            <h1 className="text-xl font-black text-white leading-tight">{profile?.name || 'User'}</h1>
            <p className="text-slate-400 text-xs mt-0.5">@{profile?.username || 'guest'}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="material-icons-round text-primary text-[13px]">school</span>
              <p className="text-[11px] text-slate-300 font-medium">{profile?.institution || 'University'}</p>
            </div>
            {profile?.is_verified && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold px-3 py-1 rounded-full">
                <span className="material-icons text-[13px]">verified</span>
                Verified Student
              </div>
            )}
         </div>
      </div>

      {/* Stats card overlapping hero */}
      <div className="px-5 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 grid grid-cols-3">
          {[
            { value: stats.itemsSold, label: 'Sold', color: 'text-primary' },
            { value: stats.activeBids, label: 'Bids', color: 'text-blue-500' },
            { value: `★ ${(profile?.rating || stats.rating || 0).toFixed(1)}`, label: 'Rating', color: 'text-amber-400' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center py-4 ${i === 1 ? 'border-x border-slate-100' : ''}`}
            >
              <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-5 space-y-2.5">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 hover:border-primary/30 hover:shadow-md transition-all text-left shadow-sm active:scale-[0.98]"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <span className="material-icons-round text-[20px]">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-secondary">{item.label}</p>
              <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
            </div>
            <span className="material-icons-round text-slate-300 text-[20px]">chevron_right</span>
          </button>
        ))}

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full mt-2 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-100 transition-colors active:scale-[0.98]"
        >
          <span className="material-icons-round text-lg">logout</span>
          Sign Out
        </button>
      </div>

      <BottomNav currentScreen={AppScreen.PROFILE} onNavigate={onNavigate} />

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <span className="material-icons-round text-red-500 text-2xl">logout</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-1">Sign Out?</h3>
            <p className="text-slate-400 text-center text-sm mb-6">
              You'll need to log in again to access your account.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
