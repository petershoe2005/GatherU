import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Favorite {
    id: string;
    user_id: string;
    item_id: string;
    created_at: string;
}

// ── localStorage fallback for guest / no-Supabase mode ──
const LOCAL_KEY = 'gatheru_favorites';

function getLocalFavorites(): string[] {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    } catch { return []; }
}

function setLocalFavorites(ids: string[]) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}

// ── Public API ──

export const fetchUserFavorites = async (userId: string | null): Promise<string[]> => {
    // Always merge local favorites
    const local = getLocalFavorites();

    if (userId && isSupabaseConfigured) {
        const { data, error } = await supabase
            .from('favorites')
            .select('item_id')
            .eq('user_id', userId);

        if (!error && data) {
            const dbIds = data.map((row: any) => row.item_id);
            // Merge: union of DB + local
            const merged = [...new Set([...dbIds, ...local])];
            return merged;
        }
    }

    return local;
};

export const fetchFavoriteItems = async (userId: string | null): Promise<any[]> => {
    if (userId && isSupabaseConfigured) {
        const { data, error } = await supabase
            .from('favorites')
            .select('*, items(*, profiles(*))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
            return data;
        }
    }

    // Fallback: build from localStorage + demo items
    const localIds = getLocalFavorites();
    if (localIds.length === 0) return [];

    // We'll return a list matching the shape FavoritesScreen expects
    // Import is dynamic to avoid circular deps
    const { DEMO_ITEMS } = await import('../data/demoData');
    return localIds.map(id => {
        const demoItem = DEMO_ITEMS.find(i => i.id === id);
        if (!demoItem) return null;
        return {
            id: `local-${id}`,
            item_id: id,
            user_id: 'guest',
            created_at: new Date().toISOString(),
            items: {
                id: demoItem.id,
                title: demoItem.title,
                images: demoItem.images,
                current_bid: demoItem.currentBid,
                starting_price: demoItem.startingPrice,
                status: demoItem.status,
                time_left: demoItem.timeLeft,
                listing_type: demoItem.listing_type,
                buy_now_price: demoItem.buyNowPrice,
                seller_id: demoItem.seller_id,
                profiles: {
                    id: demoItem.seller_id,
                    name: demoItem.seller.name,
                    avatar_url: demoItem.seller.avatar,
                    rating: demoItem.seller.rating,
                    reviews_count: demoItem.seller.reviewsCount,
                },
            },
        };
    }).filter(Boolean);
};

export const addFavorite = async (userId: string | null, itemId: string): Promise<boolean> => {
    // Always save locally
    const local = getLocalFavorites();
    if (!local.includes(itemId)) {
        setLocalFavorites([...local, itemId]);
    }

    // Also try DB if authenticated
    if (userId && isSupabaseConfigured) {
        const { error } = await supabase
            .from('favorites')
            .insert({ user_id: userId, item_id: itemId });
        if (error && error.code !== '23505') {
            console.error('Error adding favorite:', error);
        }
    }
    return true;
};

export const removeFavorite = async (userId: string | null, itemId: string): Promise<boolean> => {
    // Always remove locally
    const local = getLocalFavorites();
    setLocalFavorites(local.filter(id => id !== itemId));

    // Also try DB if authenticated
    if (userId && isSupabaseConfigured) {
        await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('item_id', itemId);
    }
    return true;
};

export const isFavorited = async (userId: string | null, itemId: string): Promise<boolean> => {
    // Check local first
    const local = getLocalFavorites();
    if (local.includes(itemId)) return true;

    // Then check DB
    if (userId && isSupabaseConfigured) {
        const { count } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('item_id', itemId);
        return (count || 0) > 0;
    }

    return false;
};
