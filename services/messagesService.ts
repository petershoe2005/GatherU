import { supabase } from '../lib/supabase';
import { Conversation, ChatMessage } from '../types';

export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
        .from('conversations')
        .select('*, buyer:profiles!conversations_buyer_id_fkey(*), seller:profiles!conversations_seller_id_fkey(*), items(*)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        item_id: row.item_id,
        buyer_id: row.buyer_id,
        seller_id: row.seller_id,
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        other_user: row.buyer_id === userId ? row.seller : row.buyer,
        item: row.items,
    }));
};

export const fetchConversationById = async (conversationId: string, currentUserId: string): Promise<Conversation | null> => {
    const { data, error } = await supabase
        .from('conversations')
        .select('*, buyer:profiles!conversations_buyer_id_fkey(*), seller:profiles!conversations_seller_id_fkey(*), items(*)')
        .eq('id', conversationId)
        .limit(1);

    if (error || !data || data.length === 0) return null;
    const row = data[0];

    return {
        id: row.id,
        item_id: row.item_id,
        buyer_id: row.buyer_id,
        seller_id: row.seller_id,
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        other_user: row.buyer_id === currentUserId ? row.seller : row.buyer,
        item: row.items,
    } as Conversation;
};

export const fetchMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return (data || []) as ChatMessage[];
};

export const sendMessage = async (
    conversationId: string,
    senderId: string,
    text: string,
    type: 'text' | 'bid' | 'alert' = 'text',
    metadata: Record<string, any> = {}
): Promise<ChatMessage | null> => {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            text,
            type,
            metadata,
        })
        .select('*')
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    // Update the conversation's last_message so the list stays current
    await supabase
        .from('conversations')
        .update({ last_message: text, last_message_at: data.created_at })
        .eq('id', conversationId);

    return data as ChatMessage;
};

export const createConversation = async (
    itemId: string | null,
    buyerId: string,
    sellerId: string
): Promise<Conversation | null> => {
    // Check if conversation already exists between these two users (with or without item)
    let existingQuery = supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId);

    if (itemId) existingQuery = existingQuery.eq('item_id', itemId);
    else existingQuery = existingQuery.is('item_id', null);

    const { data: existing } = await existingQuery.maybeSingle();
    if (existing) return existing as Conversation;

    const insertPayload: any = { buyer_id: buyerId, seller_id: sellerId };
    if (itemId) insertPayload.item_id = itemId;

    const { data, error } = await supabase
        .from('conversations')
        .insert(insertPayload)
        .select('*')
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        return null;
    }

    return data as Conversation;
};

export const subscribeToMessages = (
    conversationId: string,
    callback: (payload: any) => void
) => {
    return supabase
        .channel(`messages-${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            callback
        )
        .subscribe();
};

export const subscribeToConversations = (
    userId: string,
    callback: () => void
) => {
    // Listen for any UPDATE on conversations (last_message changes) or new INSERTs
    return supabase
        .channel(`conversations-${userId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'conversations' },
            callback
        )
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'conversations' },
            callback
        )
        .subscribe();
};
