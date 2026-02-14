
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface VerifyScreenProps {
  onVerify: () => void;
  onSkip: () => void;
  onLogin: () => void;
}

type VerifyStage = 'email' | 'code';

const VerifyScreen: React.FC<VerifyScreenProps> = ({ onVerify, onSkip, onLogin }) => {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [stage, setStage] = useState<VerifyStage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendCode = async () => {
    if (!email.endsWith('.edu')) {
      alert('Please use a valid .edu email address.');
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
    if (enteredCode.length < 8) return;

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

    // Auto-focus next input
    if (value && index < 7) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background-dark text-white overflow-hidden">
      {/* Animated Background Element */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <div className="relative w-32 h-32 mb-10 transition-transform duration-700 hover:scale-110">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-slate-900 border border-primary/30 rounded-full shadow-2xl">
          <span className="material-icons text-primary text-5xl">
            {stage === 'email' ? 'school' : 'mark_email_unread'}
          </span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-full border-4 border-background-dark shadow-xl">
          <span className="material-icons text-slate-900 text-sm font-bold">verified</span>
        </div>
      </div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-2xl font-black tracking-tight mb-3 uppercase">
          {stage === 'email' ? 'Verify Campus Status' : 'Check Your Inbox'}
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed px-4 max-w-xs mx-auto">
          {stage === 'email'
            ? 'Access the exclusive student marketplace. Just enter your university email.'
            : `We sent a 6-digit code to ${email || 'your email'}. Enter it below.`}
        </p>
      </div>

      {errorMsg && (
        <div className="w-full max-w-sm mb-4 bg-error/10 border border-error/30 rounded-xl p-3 text-center">
          <p className="text-error text-xs font-bold">{errorMsg}</p>
        </div>
      )}

      <div className="w-full space-y-6 relative z-10 max-w-sm">
        {stage === 'email' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                University Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                  <span className="material-icons text-lg">alternate_email</span>
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-500 font-medium"
                  placeholder="name@university.edu"
                  type="email"
                />
              </div>
            </div>

            <button
              onClick={handleSendCode}
              disabled={isProcessing || !email.includes('.edu')}
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
            <div className="text-center pt-2">
              <button
                onClick={onLogin}
                className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
              >
                Already verified? Log In
              </button>
            </div>
          </div>
        ) : (
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

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start space-x-3 backdrop-blur-sm">
          <span className="material-icons text-primary text-xl mt-0.5">shield</span>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            GatherU is built exclusively for students. We verify your identity to ensure a <span className="text-primary font-bold">100% scam-free</span> campus community.
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-6 text-center relative z-10">
        <button
          onClick={onSkip}
          className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors"
        >
          Explore as Guest
        </button>
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
            Trusted by the student body
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyScreen;
