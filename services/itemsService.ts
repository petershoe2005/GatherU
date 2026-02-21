import { supabase } from '../lib/supabase';
import { Item, dbItemToItem } from '../types';
import { DEMO_ITEMS } from '../data/demoData';

export const fetchItems = async (filters?: {
    category?: string;
    search?: string;
    sortBy?: 'newest' | 'price-asc' | 'price-desc';
}): Promise<Item[]> => {
    let query = supabase
        .from('items')
        .select('*, profiles(*)')
        .neq('status', 'ended');

    if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters?.sortBy === 'price-asc') {
        query = query.order('current_bid', { ascending: true });
    } else if (filters?.sortBy === 'price-desc') {
        query = query.order('current_bid', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching items:', error);
        // Fallback to demo data when DB fails
        return DEMO_ITEMS;
    }

    const items = (data || []).map((row: any) => dbItemToItem(row));
    // If no real items, show demo items
    return items.length > 0 ? items : DEMO_ITEMS;
};

export const fetchItemById = async (id: string): Promise<Item | null> => {
    const { data, error } = await supabase
        .from('items')
        .select('*, profiles(*)')
        .eq('id', id)
        .maybeSingle();

    if (error || !data) return null;
    return dbItemToItem(data);
};

export const createItem = async (itemData: {
    seller_id: string;
    title: string;
    description: string;
    category: string;
    starting_price: number;
    images: string[];
    payment_method?: string;
    time_left?: string;
    ends_at?: string;
    listing_type?: string;
    buy_now_price?: number;
    allow_offers?: boolean;
    latitude?: number;
    longitude?: number;
    deposit_percentage?: number;
}): Promise<Item | null> => {
    const { data, error } = await supabase
        .from('items')
        .insert({
            ...itemData,
            current_bid: itemData.starting_price,
            status: 'active',
        })
        .select('*, profiles(*)')
        .single();

    if (error) {
        console.error('Error creating item:', error);
        return null;
    }

    return dbItemToItem(data);
};

export const updateItem = async (id: string, updates: Partial<any>): Promise<boolean> => {
    const { error } = await supabase
        .from('items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error updating item:', error);
        return false;
    }
    return true;
};

export const deleteItem = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    return !error;
};

export const incrementViewCount = async (id: string): Promise<void> => {
    if (id.startsWith('demo-')) return;
    // Fetch current count and increment
    const { data } = await supabase
        .from('items')
        .select('view_count')
        .eq('id', id)
        .maybeSingle();

    if (data) {
        await supabase
            .from('items')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', id);
    }
};

export const endBidding = async (id: string): Promise<boolean> => {
    return updateItem(id, { status: 'sold', time_left: 'Ended' });
};

export const subscribeToItems = (callback: (payload: any) => void) => {
    return supabase
        .channel('items-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, callback)
        .subscribe();
};

export const subscribeToItem = (itemId: string, callback: (payload: any) => void) => {
    return supabase
        .channel(`item-${itemId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${itemId}` },
            callback
        )
        .subscribe();
};

export const fetchMyListings = async (sellerId: string): Promise<Item[]> => {
    const { data, error } = await supabase
        .from('items')
        .select('*, profiles(*)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map((row: any) => dbItemToItem(row));
};
