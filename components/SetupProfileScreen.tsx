
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSchoolNameFromEmail } from '../lib/universityUtils';

interface SetupProfileScreenProps {
  onComplete: (data: { name: string; username: string }) => void;
}

const SetupProfileScreen: React.FC<SetupProfileScreenProps> = ({ onComplete }) => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const schoolName = getSchoolNameFromEmail(user?.email || '');

    const { error } = await updateProfile({
      name,
      username,
      is_verified: true,
      institution: schoolName,
    });

    if (!error) {
      await updatePassword(password);
    }

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to save profile. Please try again.');
    } else {
      onComplete({ name, username });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background-dark text-white overflow-hidden font-display">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-slate-900 border border-primary/30 rounded-full shadow-2xl">
          <span className="material-icons text-primary text-4xl">person_add</span>
        </div>
      </div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">Complete Your Profile</h1>
        <p className="text-slate-400 text-sm leading-relaxed px-4 max-w-xs mx-auto">
          Just a few more details to get you started in the marketplace.
        </p>
      </div>

      {errorMsg && (
        <div className="w-full max-w-sm mb-4 bg-error/10 border border-error/30 rounded-xl p-3 text-center">
          <p className="text-error text-xs font-bold">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-5 relative z-10 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
            Full Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
              <span className="material-icons text-lg">badge</span>
            </div>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
              placeholder="e.g. Alex Harrison"
              type="text"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
            Username
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
              <span className="material-icons text-lg">alternate_email</span>
            </div>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
              placeholder="alex_harrison"
              type="text"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
            Create Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
              <span className="material-icons text-lg">lock</span>
            </div>
            <input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-12 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-icons text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
            Confirm Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
              <span className="material-icons text-lg">lock_reset</span>
            </div>
            <input
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
              placeholder="••••••••"
              type="password"
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name || !username || !password || !confirmPassword}
          className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Finish Setup</span>
              <span className="material-icons text-sm">rocket_launch</span>
            </>
          )}
        </button>
      </form >

      <div className="mt-8 text-center opacity-50">
        <p className="text-[10px] font-bold uppercase tracking-widest">Step 2 of 2: Profile Details</p>
      </div>
    </div >
  );
};

export default SetupProfileScreen;
