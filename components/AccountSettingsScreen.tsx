
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { updateSettings, updateProfile } from '../services/profileService';
import { supabase } from '../lib/supabase';

interface AccountSettingsScreenProps {
  onBack: () => void;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ onBack }) => {
  const { profile, refreshProfile, signOut } = useAuth();
  const [gpsRadius, setGpsRadius] = useState(profile?.gps_radius || 5);
  const [biddingAlerts, setBiddingAlerts] = useState(profile?.bidding_alerts ?? true);
  const [msgAlerts, setMsgAlerts] = useState(profile?.message_alerts ?? true);
  const [saving, setSaving] = useState(false);

  // Change Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Edit Name state
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);

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

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!newPassword || !confirmPassword || !currentPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    // Verify old password by attempting sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || '',
      password: currentPassword,
    });
    if (signInError) {
      setPasswordError('Current password is incorrect.');
      setChangingPassword(false);
      return;
    }
    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (updateError) {
      setPasswordError(updateError.message || 'Failed to update password.');
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowChangePassword(false);
    }, 2000);
  };

  const handleSaveName = async () => {
    if (!profile || !newName.trim()) return;
    const trimmedName = newName.trim();
    // Optimistic: close modal and show new name instantly
    setShowEditName(false);
    // Fire Supabase update in background (no await blocking the UI)
    updateProfile(profile.id, { name: trimmedName }).then(() => refreshProfile());
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
            <div
              onClick={() => { setNewName(profile?.name || ''); setShowEditName(true); }}
              className="flex items-center px-4 py-4 space-x-4 border-b border-border-dark hover:bg-white/5 transition-colors cursor-pointer"
            >
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
            <button onClick={() => { setPasswordError(''); setPasswordSuccess(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowChangePassword(true); }} className="w-full flex items-center px-4 py-4 space-x-4 border-b border-border-dark text-left hover:bg-white/5 transition-colors">
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
                  className="w-full h-2.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-primary"
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

      {/* Change Password Sub-View */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 bg-background-dark flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 px-6 py-4 flex items-center bg-background-dark/90 backdrop-blur-xl border-b border-border-dark">
            <button onClick={() => setShowChangePassword(false)} className="w-10 h-10 flex items-center justify-start text-primary active:scale-90 transition-transform">
              <span className="material-icons-round font-bold">arrow_back_ios</span>
            </button>
            <h1 className="flex-1 text-center font-bold text-lg mr-10 tracking-tight text-white">Change Password</h1>
          </header>

          <main className="flex-1 px-5 pt-8 max-w-md mx-auto w-full space-y-6">
            {passwordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                <span className="material-icons-round text-emerald-400">check_circle</span>
                <p className="text-emerald-400 font-semibold text-sm">Password updated successfully!</p>
              </div>
            )}

            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
                <span className="material-icons-round text-red-400">error</span>
                <p className="text-red-400 font-semibold text-sm">{passwordError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {changingPassword ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-icons-round text-sm">lock</span>
                  Update Password
                </>
              )}
            </button>
          </main>
        </div>
      )}

      {/* Edit Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-surface-dark border border-border-dark rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Name</h2>
              <button onClick={() => setShowEditName(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-500 uppercase px-1">Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditName(false)}
                className="flex-1 bg-slate-700/50 text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                disabled={savingName || !newName.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-slate-900 font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingName ? (
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsScreen;
