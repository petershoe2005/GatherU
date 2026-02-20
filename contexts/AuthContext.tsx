import React, { useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getSchoolNameFromEmail } from '../lib/universityUtils';
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

        // Helper: build initial profile data from auth user
        const buildInitialProfile = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const email = authUser?.email || '';
            const emailPrefix = email.split('@')[0] || '';
            // Derive a readable name from the email prefix (e.g. "lxu" → "Lxu", "peter.xu" → "Peter Xu")
            const derivedName = emailPrefix
                .split(/[._-]/)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
            const isEdu = email.toLowerCase().endsWith('.edu');
            const schoolName = getSchoolNameFromEmail(email);

            return {
                id: userId,
                email,
                name: derivedName,
                username: emailPrefix,
                is_verified: isEdu,
                institution: isEdu ? (schoolName !== 'University' ? schoolName : (email.split('@')[1]?.replace('.edu', '').toUpperCase() || '')) : '',
            };
        };

        if (!data && !error) {
            // Profile doesn't exist yet — create it with user info
            const initialData = await buildInitialProfile();
            const { data: newProfile } = await supabase
                .from('profiles')
                .upsert(initialData, { onConflict: 'id' })
                .select('*')
                .maybeSingle();
            if (newProfile) setProfile(newProfile as Profile);
            return newProfile as Profile | null;
        }

        if (error && (error.code === 'PGRST116' || error.code === '406')) {
            const initialData = await buildInitialProfile();
            const { data: newProfile } = await supabase
                .from('profiles')
                .upsert(initialData, { onConflict: 'id' })
                .select('*')
                .maybeSingle();
            if (newProfile) setProfile(newProfile as Profile);
            return newProfile as Profile | null;
        }

        if (!error && data) {
            let profileData = data as Profile;
            // If existing profile has empty name, populate from email
            if (!profileData.name || profileData.name === '') {
                const initialData = await buildInitialProfile();
                const { data: updated } = await supabase
                    .from('profiles')
                    .update({ name: initialData.name, username: initialData.username, email: initialData.email, is_verified: initialData.is_verified, institution: initialData.institution || profileData.institution })
                    .eq('id', userId)
                    .select('*')
                    .maybeSingle();
                if (updated) profileData = updated as Profile;
            }
            setProfile(profileData);
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
            async (event, s) => {
                // During manual signOut, loading is true and we handle state ourselves
                if (event === 'SIGNED_OUT') return;
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

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        return { error };
    };

    const signOut = async () => {
        // Clear local state immediately for instant UI response
        setSession(null);
        setUser(null);
        setProfile(null);
        // Revoke server session in the background — don't block the UI
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
                signInWithGoogle,
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
