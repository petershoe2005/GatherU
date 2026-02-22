import { supabase } from '../lib/supabase';
import { Bid } from '../types';

export const placeBid = async (
    itemId: string,
    bidderId: string,
    amount: number
): Promise<Bid | null> => {
    const { data, error } = await supabase
        .from('bids')
        .insert({ item_id: itemId, bidder_id: bidderId, amount })
        .select('*')
        .single();

    if (error) {
        console.error('Error placing bid:', error);
        return null;
    }

    return data as Bid;
};

export const fetchBidsForItem = async (itemId: string): Promise<Bid[]> => {
    // Demo items have non-UUID IDs — skip DB query
    if (itemId.startsWith('demo-')) return [];

    const { data, error } = await supabase
        .from('bids')
        .select('*, profiles(*)')
        .eq('item_id', itemId)
        .order('amount', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching bids:', error);
        return [];
    }

    return (data || []).map((row: any) => ({
        ...row,
        bidder: row.profiles,
    })) as Bid[];
};

export const fetchUserBids = async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('bids')
        .select('*, items(*, profiles(*), orders(seller_confirmed, buyer_confirmed, status))')
        .eq('bidder_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user bids:', error);
        return [];
    }

    return data || [];
};

export const subscribeToBids = (itemId: string, callback: (payload: any) => void) => {
    return supabase
        .channel(`bids-${itemId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${itemId}` },
            callback
        )
        .subscribe();
};
