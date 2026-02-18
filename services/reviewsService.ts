
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Review {
    id: string;
    reviewer_id: string;
    seller_id: string;
    item_id: string;
    rating: number;
    comment: string;
    reviewer_name?: string;
    reviewer_avatar?: string;
    created_at: string;
}

export const submitReview = async (review: {
    reviewer_id: string;
    seller_id: string;
    item_id: string;
    rating: number;
    comment: string;
}): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase.from('reviews').insert(review);
    if (error) {
        console.error('Error submitting review:', error);
        return false;
    }

    // Update seller's average rating
    const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', review.seller_id);

    if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
        await supabase
            .from('profiles')
            .update({ rating: Math.round(avg * 10) / 10 })
            .eq('id', review.seller_id);
    }

    return true;
};

export const fetchReviewsForSeller = async (sellerId: string): Promise<Review[]> => {
    if (!isSupabaseConfigured || sellerId.startsWith('demo-')) return [];

    const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_reviewer_id_fkey(name, avatar_url)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        reviewer_id: r.reviewer_id,
        seller_id: r.seller_id,
        item_id: r.item_id,
        rating: r.rating,
        comment: r.comment || '',
        reviewer_name: r.profiles?.name || 'Anonymous',
        reviewer_avatar: r.profiles?.avatar_url || '',
        created_at: r.created_at,
    }));
};

export const hasUserReviewed = async (reviewerId: string, itemId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewer_id', reviewerId)
        .eq('item_id', itemId)
        .limit(1);

    return (data || []).length > 0;
};
