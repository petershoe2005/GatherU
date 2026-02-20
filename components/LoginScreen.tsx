import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

interface LoginScreenProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
    const { signInWithPassword, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true);
        setErrorMsg('');
        const { error } = await signInWithGoogle();
        setIsSubmitting(false);
        if (error) {
            setErrorMsg(error.message || 'Google sign-in failed. Please try again.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;


        setIsSubmitting(true);
        setErrorMsg('');

        const { error } = await signInWithPassword(email, password);
        setIsSubmitting(false);

        if (error) {
            setErrorMsg(error.message || 'Failed to sign in. Please check your credentials.');
        } else {
            onLoginSuccess();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background-dark text-white overflow-hidden font-display">
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

            <div className="w-40 h-40 mb-6 rounded-full border-2 border-primary/40 bg-slate-900/60 flex items-center justify-center">
                <img src="/logo.png" alt="GatherU" className="w-36 h-36 object-contain" style={{ mixBlendMode: 'screen' }} />
            </div>

            <div className="text-center mb-8 relative z-10">
                <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">Welcome Back</h1>
                <p className="text-slate-400 text-sm leading-relaxed px-4 max-w-xs mx-auto">
                    Sign in to access your campus marketplace.
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
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                            <span className="material-icons text-lg">alternate_email</span>
                        </div>
                        <input
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
                            placeholder="name@email.com"
                            type="email"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                        Password
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                            <span className="material-icons text-lg">lock</span>
                        </div>
                        <input
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
                            placeholder="••••••••"
                            type="password"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !email || !password}
                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>Sign In</span>
                            <span className="material-icons text-sm">login</span>
                        </>
                    )}
                </button>
            </form>

            <div className="w-full max-w-sm relative z-10 space-y-4 mt-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Sign in with Google</span>
                </button>
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={onBack}
                    className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
                >
                    Never mind, I need to verify
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;
