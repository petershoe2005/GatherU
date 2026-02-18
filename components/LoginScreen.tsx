import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

interface LoginScreenProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
    const { signInWithPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        if (!email.endsWith('.edu')) {
            setErrorMsg('Please use your university .edu email.');
            return;
        }

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

            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-slate-900 border border-primary/30 rounded-full shadow-2xl">
                    <span className="material-icons text-primary text-4xl">lock_open</span>
                </div>
            </div>

            <div className="text-center mb-8 relative z-10">
                <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">Welcome Back</h1>
                <p className="text-slate-400 text-sm leading-relaxed px-4 max-w-xs mx-auto">
                    Sign in to continue to campus marketplace.
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
                        University Email
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
                            placeholder="name@university.edu"
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

            <div className="mt-8 text-center">
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
