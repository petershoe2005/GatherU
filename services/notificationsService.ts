import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';

export const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return (data || []) as AppNotification[];
};

export const fetchUnreadCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

    if (error) return 0;
    return count || 0;
};

export const markNotificationRead = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    return !error;
};

export const markAllNotificationsRead = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    return !error;
};

export const deleteNotification = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    return !error;
};

export const subscribeToNotifications = (
    userId: string,
    callback: (payload: any) => void
) => {
    return supabase
        .channel(`notifications-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            callback
        )
        .subscribe();
};
