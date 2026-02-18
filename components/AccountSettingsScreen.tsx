
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { updateSettings } from '../services/profileService';

interface AccountSettingsScreenProps {
  onBack: () => void;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ onBack }) => {
  const { profile, refreshProfile, signOut } = useAuth();
  const [gpsRadius, setGpsRadius] = useState(profile?.gps_radius || 5);
  const [biddingAlerts, setBiddingAlerts] = useState(profile?.bidding_alerts ?? true);
  const [msgAlerts, setMsgAlerts] = useState(profile?.message_alerts ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setGpsRadius(profile.gps_radius || 5);
      setBiddingAlerts(profile.bidding_alerts ?? true);
      setMsgAlerts(profile.message_alerts ?? true);
    }
  }, [profile]);

  const handleSave = async (field: string, value: any) => {
    if (!profile) return;
    setSaving(true);
    await updateSettings(profile.id, { [field]: value });
    await refreshProfile();
    setSaving(false);
  };

  return (
    <div className="flex-1 bg-background-dark text-slate-100 min-h-screen font-display overflow-y-auto pb-10">
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center bg-background-dark/90 backdrop-blur-xl border-b border-border-dark">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-start text-primary active:scale-90 transition-transform">
          <span className="material-icons-round font-bold">arrow_back_ios</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-lg mr-10 tracking-tight">Account Settings</h1>
      </header>

      <main className="px-5 space-y-8 mt-6">
        <section>
          <h2 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1 mb-2.5">Personal Info</h2>
          <div className="bg-surface-dark border border-border-dark overflow-hidden rounded-2xl">
            <div className="flex items-center px-4 py-4 space-x-4 border-b border-border-dark hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-icons-round">person</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">{profile?.name || 'User'}</p>
                <p className="text-xs text-slate-400">Full Name</p>
              </div>
              <span className="material-icons-round text-slate-600 text-xl">chevron_right</span>
            </div>
            <div className="flex items-center px-4 py-4 space-x-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <span className="material-icons-round">alternate_email</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">{profile?.email || 'email@university.edu'}</p>
                <p className="text-xs text-slate-400">EDU Email Address</p>
              </div>
              <span className="material-icons-round text-slate-600 text-xl">lock</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1 mb-2.5">Security</h2>
          <div className="bg-surface-dark border border-border-dark overflow-hidden rounded-2xl shadow-sm">
            <button className="w-full flex items-center px-4 py-4 space-x-4 border-b border-border-dark text-left hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <span className="material-icons-round">password</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">Change Password</p>
              </div>
              <span className="material-icons-round text-slate-600 text-xl">chevron_right</span>
            </button>
            <button className="w-full flex items-center px-4 py-4 space-x-4 text-left hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-icons-round">security</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">Two-Factor Auth</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">ACTIVE</span>
                <span className="material-icons-round text-slate-600 text-xl">chevron_right</span>
              </div>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1 mb-2.5">Notification Preferences</h2>
          <div className="bg-surface-dark border border-border-dark overflow-hidden rounded-2xl shadow-sm">
            <div className="flex items-center px-4 py-4 space-x-4 border-b border-border-dark">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <span className="material-icons-round">gavel</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base text-slate-100">Bidding Alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={biddingAlerts}
                  onChange={() => {
                    const newVal = !biddingAlerts;
                    setBiddingAlerts(newVal);
                    handleSave('bidding_alerts', newVal);
                  }}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-12 h-7 bg-slate-700 rounded-full peer peer-checked:bg-primary transition-colors">
                  <div className={`absolute top-[4px] left-[4px] bg-white rounded-full h-5 w-5 transition-all ${biddingAlerts ? 'translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>
            <div className="flex items-center px-4 py-4 space-x-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-icons-round">chat_bubble</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base text-slate-100">Messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={msgAlerts}
                  onChange={() => {
                    const newVal = !msgAlerts;
                    setMsgAlerts(newVal);
                    handleSave('message_alerts', newVal);
                  }}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-12 h-7 bg-slate-700 rounded-full peer peer-checked:bg-amber-500 transition-colors">
                  <div className={`absolute top-[4px] left-[4px] bg-white rounded-full h-5 w-5 transition-all ${msgAlerts ? 'translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1 mb-2.5">Location Privacy</h2>
          <div className="bg-surface-dark border border-border-dark overflow-hidden rounded-2xl">
            <div className="px-4 py-5 space-y-5">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-icons-round">radar</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-base">GPS Radius</p>
                  <p className="text-xs text-slate-400">Items within <span className="text-primary font-bold">{gpsRadius} miles</span></p>
                </div>
              </div>
              <div className="relative pt-1 px-1">
                <input
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  max="50" min="1" type="range"
                  value={gpsRadius}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setGpsRadius(val);
                  }}
                  onMouseUp={() => handleSave('gps_radius', gpsRadius)}
                  onTouchEnd={() => handleSave('gps_radius', gpsRadius)}
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-wider">
                  <span>1 Mile</span>
                  <span>50 Miles</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 space-y-4">
          <button
            onClick={signOut}
            className="w-full bg-red-500/10 active:bg-red-500/20 text-red-500 py-4 px-6 rounded-2xl flex items-center justify-center font-bold border border-red-500/20 transition-colors"
          >
            <span className="material-icons-round mr-2 text-xl">logout</span>
            Sign Out
          </button>
          <p className="text-center text-slate-500 text-[11px] leading-relaxed mt-5 px-8">
            Your marketplace data remains encrypted and secure.
          </p>
        </section>
      </main>
    </div>
  );
};

export default AccountSettingsScreen;
