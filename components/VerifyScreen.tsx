
import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

interface VerifyScreenProps {
  onVerify: () => void;
  onLogin: () => void;
}

type SignUpRole = null | 'student' | 'local';
type VerifyStage = 'role' | 'email' | 'code';

const VerifyScreen: React.FC<VerifyScreenProps> = ({ onVerify, onLogin }) => {
  const { signInWithOtp, verifyOtp, signInWithGoogle } = useAuth();
  const [role, setRole] = useState<SignUpRole>(null);
  const [stage, setStage] = useState<VerifyStage>('role');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    const { error } = await signInWithGoogle();
    setIsProcessing(false);
    if (error) {
      setErrorMsg(error.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleSelectRole = (selectedRole: SignUpRole) => {
    setRole(selectedRole);
    setStage('email');
    setEmail('');
    setErrorMsg('');
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (role === 'student' && !email.toLowerCase().endsWith('.edu')) {
      setErrorMsg('Please use your university .edu email to sign up as a student.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    const { error } = await signInWithOtp(email);
    setIsProcessing(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to send code. Please try again.');
    } else {
      setStage('code');
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = code.join('');
    if (enteredCode.length < 6) return;

    setIsProcessing(true);
    setErrorMsg('');

    const { error } = await verifyOtp(email, enteredCode);
    setIsProcessing(false);

    if (error) {
      setErrorMsg(error.message || 'Invalid code. Please try again.');
    } else {
      onVerify();
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background-dark text-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      {/* Logo */}
      <div className="w-40 h-40 mb-6 rounded-full border-2 border-primary/40 bg-slate-900/60 flex items-center justify-center">
        <img src="/logo.png" alt="GatherU" className="w-36 h-36 object-contain" style={{ mixBlendMode: 'screen' }} />
      </div>

      {/* Title */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-2xl font-black tracking-tight mb-3 uppercase">
          {stage === 'role' ? 'Join GatherU' : stage === 'email'
            ? (role === 'student' ? 'Student Verification' : 'Create Account')
            : 'Check Your Inbox'}
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed px-4 max-w-xs mx-auto">
          {stage === 'role' && 'Choose your role in the campus community.'}
          {stage === 'email' && role === 'student' && 'Enter your .edu email to get verified student status.'}
          {stage === 'email' && role === 'local' && 'Enter your email to join as a local member.'}
          {stage === 'code' && `We sent a 6-digit code to ${email}. Enter it below.`}
        </p>
      </div>

      {errorMsg && (
        <div className="w-full max-w-sm mb-4 bg-error/10 border border-error/30 rounded-xl p-3 text-center">
          <p className="text-error text-xs font-bold">{errorMsg}</p>
        </div>
      )}

      <div className="w-full space-y-5 relative z-10 max-w-sm">

        {/* Stage 1: Role Selection */}
        {stage === 'role' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Google Sign-In — recommended for students */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isProcessing}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-emerald-400/80 font-semibold">
              ✓ Recommended for .edu students — instant verification
            </p>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <button
              onClick={() => handleSelectRole('student')}
              className="w-full bg-surface-dark border-2 border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] group"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <span className="material-icons text-emerald-400 text-2xl">school</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-base text-white">I'm a Student</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Sign up with your .edu email and get a <span className="text-emerald-400 font-semibold">verified badge</span></p>
              </div>
              <span className="material-icons text-slate-600 group-hover:text-emerald-400 transition-colors">arrow_forward_ios</span>
            </button>

            <button
              onClick={() => handleSelectRole('local')}
              className="w-full bg-surface-dark border-2 border-blue-500/30 hover:border-blue-500/60 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] group"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <span className="material-icons text-blue-400 text-2xl">person</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-base text-white">Local Member</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Join with any email as a <span className="text-blue-400 font-semibold">local community member</span></p>
              </div>
              <span className="material-icons text-slate-600 group-hover:text-blue-400 transition-colors">arrow_forward_ios</span>
            </button>

            <div className="text-center pt-3">
              <button
                onClick={onLogin}
                className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
              >
                Already have an account? Log In
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: Email Input */}
        {stage === 'email' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Role badge */}
            <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit ${role === 'student' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <span className="material-icons text-sm">{role === 'student' ? 'school' : 'person'}</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {role === 'student' ? 'Student Account' : 'Local Member Account'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                {role === 'student' ? 'University Email (.edu)' : 'Email Address'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                  <span className="material-icons text-lg">alternate_email</span>
                </div>
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-500 font-medium"
                  placeholder={role === 'student' ? 'name@university.edu' : 'name@email.com'}
                  type="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              onClick={handleSendCode}
              disabled={isProcessing || !email.includes('@')}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Get Verification Code</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </>
              )}
            </button>

            <button
              onClick={() => { setStage('role'); setErrorMsg(''); }}
              className="w-full py-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors text-center"
            >
              ← Choose a different option
            </button>
          </div>
        )}

        {/* Stage 3: Code Verification */}
        {stage === 'code' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between gap-2 px-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`code-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  className="w-10 h-14 text-center text-xl font-black bg-slate-900/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white caret-white"
                  style={{ color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleVerifyCode}
                disabled={isProcessing || code.some(d => !d)}
                className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                  <span>Verify and Continue</span>
                )}
              </button>

              <button
                onClick={() => setStage('email')}
                className="w-full py-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
              >
                Change Email Address
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Social proof */}
      <div className="mt-10 text-center relative z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex -space-x-2">
            {[10, 11, 12].map(i => (
              <img
                key={i}
                className="w-8 h-8 rounded-full border-2 border-background-dark shadow-lg"
                src={`https://picsum.photos/seed/${i}/100/100`}
                alt="user"
              />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-800 flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-black text-primary">+8k</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">
            Trusted by students & locals
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyScreen;
