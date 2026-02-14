import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

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
        .single();

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
        .single();

    return {
        itemsSold: soldCount || 0,
        activeBids: bidsCount || 0,
        rating: profileData?.rating || 0,
    };
};
