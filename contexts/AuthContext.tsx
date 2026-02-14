import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: SupabaseUser | null;
    profile: Profile | null;
    loading: boolean;
    signInWithOtp: (email: string) => Promise<{ error: any }>;
    verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
    updatePassword: (password: string) => Promise<{ error: any }>;
    signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
        return data as Profile | null;
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let didTimeout = false;

        // Safety timeout — if Supabase doesn't respond in 5s, stop loading
        const timeout = setTimeout(() => {
            didTimeout = true;
            if (loading) {
                console.warn('Supabase connection timed out — proceeding without session');
                setLoading(false);
            }
        }, 5000);

        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session: s } }) => {
                if (didTimeout) return;
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) {
                    fetchProfile(s.user.id).finally(() => {
                        clearTimeout(timeout);
                        setLoading(false);
                    });
                } else {
                    clearTimeout(timeout);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error('Supabase getSession error:', err);
                clearTimeout(timeout);
                setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) {
                    await fetchProfile(s.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signInWithOtp = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        return { error };
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
    };

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const verifyOtp = async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) return { error: new Error('Not authenticated') };

        const { error } = await supabase
            .from('profiles')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (!error) {
            await fetchProfile(user.id);
        }
        return { error };
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                loading,
                signInWithOtp,
                verifyOtp,
                signOut,
                updateProfile,
                updatePassword,
                signInWithPassword,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
