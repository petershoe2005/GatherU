import { supabase } from '../lib/supabase';
import { Order } from '../types';

export const createOrder = async (
    itemId: string,
    buyerId: string,
    sellerId: string,
    finalPrice: number
): Promise<Order | null> => {
    const platformFee = +(finalPrice * 0.03).toFixed(2);

    const { data, error } = await supabase
        .from('orders')
        .insert({
            item_id: itemId,
            buyer_id: buyerId,
            seller_id: sellerId,
            final_price: finalPrice,
            platform_fee: platformFee,
            status: 'pending',
        })
        .select('*')
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return null;
    }

    return data as Order;
};

export const fetchOrderForItem = async (itemId: string, userId: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('item_id', itemId)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return data as Order;
};

export const sellerConfirmDelivery = async (orderId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({ seller_confirmed: true, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    return !error;
};

export const buyerConfirmDelivery = async (orderId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({
            buyer_confirmed: true,
            status: 'delivered',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    return !error;
};

export const rejectDelivery = async (
    orderId: string,
    userId: string,
    reason: string
): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            rejected_by: userId,
            rejected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    return !error;
};

export const confirmDelivery = async (orderId: string): Promise<boolean> => {
    return buyerConfirmDelivery(orderId);
};

export const submitReview = async (
    orderId: string,
    rating: number,
    reviewComment: string
): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'rated',
            rating,
            review_comment: reviewComment,
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    return !error;
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, items(*, profiles(*)), seller:profiles!orders_seller_id_fkey(*)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return (data || []) as Order[];
};
