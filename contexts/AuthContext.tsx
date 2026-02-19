import React, { useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { AuthContext } from './AuthContextDef';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!data && !error) {
            // Profile doesn't exist yet — create it
            const { data: newProfile } = await supabase
                .from('profiles')
                .upsert({ id: userId }, { onConflict: 'id' })
                .select('*')
                .maybeSingle();
            if (newProfile) setProfile(newProfile as Profile);
            return newProfile as Profile | null;
        }

        if (error && (error.code === 'PGRST116' || error.code === '406')) {
            const { data: newProfile } = await supabase
                .from('profiles')
                .upsert({ id: userId }, { onConflict: 'id' })
                .select('*')
                .maybeSingle();
            if (newProfile) setProfile(newProfile as Profile);
            return newProfile as Profile | null;
        }

        if (!error && data) {
            setProfile(data as Profile);
        }
        return data as Profile | null;
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    useEffect(() => {
        let didTimeout = false;

        const timeout = setTimeout(() => {
            didTimeout = true;
            if (loading) {
                console.warn('Supabase connection timed out — proceeding without session');
                setLoading(false);
            }
        }, 15000);

        supabase.auth.getSession()
            .then(({ data: { session: s } }) => {
                clearTimeout(timeout);
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) {
                    fetchProfile(s.user.id).finally(() => setLoading(false));
                } else {
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error('Supabase getSession error:', err);
                clearTimeout(timeout);
                setLoading(false);
            });

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
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
        return { error };
    };

    const signOut = async () => {
        // Clear local state immediately for instant UI response
        setSession(null);
        setUser(null);
        setProfile(null);
        // Fire Supabase sign-out in background
        supabase.auth.signOut().catch(console.error);
    };

    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) return { error: new Error('Not authenticated') };
        const { error } = await supabase
            .from('profiles')
            .upsert(
                { id: user.id, email: user.email, ...data, updated_at: new Date().toISOString() },
                { onConflict: 'id' }
            );
        if (!error) await fetchProfile(user.id);
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
