
import React, { useState, useEffect } from 'react';
import { AppScreen } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfileStats } from '../services/profileService';
import BottomNav from './BottomNav';

interface ProfileScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({ itemsSold: 0, activeBids: 0, rating: 0 });

  useEffect(() => {
    if (profile) {
      fetchProfileStats(profile.id).then(setStats);
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex-1 bg-background-dark text-white pb-24 font-display">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-b from-primary/20 via-background-dark to-background-dark pt-12 pb-6 px-6">
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
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-primary">{stats.itemsSold}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sold</p>
          </div>
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-primary">{stats.activeBids}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Bids</p>
          </div>
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-amber-400">★ {(profile?.rating || stats.rating || 0).toFixed(1)}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Rating</p>
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
            className="w-full bg-surface-dark border border-border-dark rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all text-left"
          >
            <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
              <span className="material-icons-round">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
            <span className="material-icons-round text-slate-600">chevron_right</span>
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
    </div>
  );
};

export default ProfileScreen;
