import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data as Profile;
};

export const updateProfile = async (
    userId: string,
    updates: Partial<Profile>
): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }

    return data as Profile;
};

export const updateSettings = async (
    userId: string,
    settings: {
        gps_radius?: number;
        bidding_alerts?: boolean;
        message_alerts?: boolean;
        accept_cash?: boolean;
        location?: string;
    }
): Promise<boolean> => {
    const { error } = await supabase
        .from('profiles')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', userId);

    return !error;
};

export const fetchProfileStats = async (
    userId: string
): Promise<{ itemsSold: number; activeBids: number; rating: number }> => {
    // Count sold items
    const { count: soldCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'sold');

    // Count active bids
    const { count: bidsCount } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('bidder_id', userId);

    // Get rating
    const { data: profileData } = await supabase
        .from('profiles')
        .select('rating')
        .eq('id', userId)
        .maybeSingle();

    return {
        itemsSold: soldCount || 0,
        activeBids: bidsCount || 0,
        rating: profileData?.rating || 0,
    };
};

/**
 * Fetch a user's public profile with stats (items sold, items bought)
 */
export const fetchPublicProfile = async (userId: string) => {
    // Guard: demo IDs have no real profiles
    if (userId.startsWith('demo-')) {
        return { profile: null, itemsSold: 0, itemsBought: 0 };
    }

    try {
        const [profileResult, soldResult, boughtResult] = await Promise.allSettled([
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            supabase.from('items').select('*', { count: 'exact', head: true }).eq('seller_id', userId).eq('status', 'sold'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', userId),
        ]);

        const profile = profileResult.status === 'fulfilled' ? (profileResult.value.data as Profile | null) : null;
        const itemsSold = soldResult.status === 'fulfilled' ? (soldResult.value.count || 0) : 0;
        const itemsBought = boughtResult.status === 'fulfilled' ? (boughtResult.value.count || 0) : 0;

        return { profile, itemsSold, itemsBought };
    } catch (err) {
        console.error('fetchPublicProfile error:', err);
        return { profile: null, itemsSold: 0, itemsBought: 0 };
    }
};
