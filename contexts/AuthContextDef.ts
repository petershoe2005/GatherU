import { createContext } from 'react';
import type { Profile } from '../types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
