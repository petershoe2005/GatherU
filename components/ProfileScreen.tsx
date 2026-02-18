
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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    onNavigate(AppScreen.LOGIN);
  };

  return (
    <div className="flex-1 bg-background-light pb-24 font-display">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-b from-secondary to-slate-900 pt-12 pb-6 px-6 text-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              className="w-20 h-20 rounded-full border-3 border-primary/30 object-cover shadow-xl"
              src={profile?.avatar_url || 'https://picsum.photos/seed/profile/200/200'}
              alt={profile?.name}
            />
            {profile?.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-full border-3 border-background-dark">
                <span className="material-icons text-slate-900 text-xs">check</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">{profile?.name || 'User'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">@{profile?.username || 'guest'}</p>
            <p className="text-[10px] text-primary font-semibold mt-1">
              <span className="material-icons-round text-[12px] align-middle mr-0.5">school</span>
              {profile?.institution || 'University'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-primary">{stats.itemsSold}</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Sold</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-primary">{stats.activeBids}</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Bids</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-amber-400">★ {(profile?.rating || stats.rating || 0).toFixed(1)}</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Rating</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6 space-y-3">
        {[
          { screen: AppScreen.MY_LISTINGS, icon: 'inventory_2', label: 'My Listings', desc: 'Manage your active listings', color: 'text-primary' },
          { screen: AppScreen.FAVORITES, icon: 'favorite', label: 'Favorites', desc: 'Items you saved', color: 'text-rose-400' },
          { screen: AppScreen.PURCHASE_HISTORY, icon: 'receipt_long', label: 'Purchase History', desc: 'View past transactions', color: 'text-amber-400' },
          { screen: AppScreen.PAYMENT_METHODS, icon: 'account_balance_wallet', label: 'Payments & Payouts', desc: 'Manage payment methods', color: 'text-blue-400' },
          { screen: AppScreen.ACCOUNT_SETTINGS, icon: 'settings', label: 'Account Settings', desc: 'Privacy, notifications, security', color: 'text-slate-400' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-md"
          >
            <div className={`w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center ${item.color}`}>
              <span className="material-icons-round">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-secondary">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
            <span className="material-icons-round text-slate-400">chevron_right</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-500/20 transition-colors"
        >
          <span className="material-icons-round text-lg">logout</span>
          Sign Out
        </button>
      </div>

      <BottomNav currentScreen={AppScreen.PROFILE} onNavigate={onNavigate} />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="material-icons-round text-red-500 text-2xl">logout</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-2">Sign Out?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to sign out? You will need to log in again to access your account.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
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
