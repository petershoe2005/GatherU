
import React, { useState, useEffect } from 'react';
import { AppScreen, AppNotification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    subscribeToNotifications,
} from '../services/notificationsService';
import BottomNav from './BottomNav';

interface NotificationsScreenProps {
    onBack: () => void;
    onNavigate: (screen: AppScreen) => void;
}

const DEMO_NOTIFICATIONS: AppNotification[] = [
    {
        id: '1',
        user_id: '',
        type: 'system',
        title: 'Welcome to GatherU! 🎉',
        body: 'Your campus marketplace is ready. Start browsing items or create your first listing.',
        read: false,
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        user_id: '',
        type: 'system',
        title: 'Complete Your Profile',
        body: 'Add a photo and bio to build trust with other students.',
        read: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
];

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, onNavigate }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        loadNotifications();
    }, [user]);

    // Realtime: listen for new notifications
    useEffect(() => {
        if (!user || !isSupabaseConfigured) return;
        const channel = subscribeToNotifications(user.id, (payload: any) => {
            if (payload.new) {
                setNotifications(prev => [payload.new as AppNotification, ...prev]);
            }
        });
        return () => { channel.unsubscribe(); };
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        if (user && isSupabaseConfigured) {
            const data = await fetchNotifications(user.id);
            setNotifications(data.length > 0 ? data : DEMO_NOTIFICATIONS);
        } else {
            setNotifications(DEMO_NOTIFICATIONS);
        }
        setLoading(false);
    };

    const handleMarkAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        if (user && isSupabaseConfigured) {
            await markNotificationRead(id);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (user && isSupabaseConfigured) {
            await markAllNotificationsRead(user.id);
        }
    };

    const handleDelete = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (user && isSupabaseConfigured) {
            await deleteNotification(id);
        }
    };

    const handleNotificationTap = (notif: AppNotification) => {
        handleMarkAsRead(notif.id);
        // Navigate based on notification type
        if (notif.data?.item_id) {
            onNavigate(AppScreen.FEED); // Could deep-link to item in future
        } else if (notif.data?.conversation_id) {
            onNavigate(AppScreen.MESSAGES);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        if (diffMin < 1) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'bid': return { icon: 'gavel', color: 'text-primary', bg: 'bg-primary/10' };
            case 'outbid': return { icon: 'trending_down', color: 'text-orange-400', bg: 'bg-orange-400/10' };
            case 'message': return { icon: 'chat_bubble', color: 'text-blue-400', bg: 'bg-blue-400/10' };
            case 'sold': return { icon: 'sell', color: 'text-green-400', bg: 'bg-green-400/10' };
            case 'order': return { icon: 'shopping_bag', color: 'text-purple-400', bg: 'bg-purple-400/10' };
            case 'review': return { icon: 'star', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
            case 'system': return { icon: 'info', color: 'text-amber-400', bg: 'bg-amber-400/10' };
            default: return { icon: 'notifications', color: 'text-slate-400', bg: 'bg-slate-400/10' };
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

    return (
        <div className="flex-1 bg-background-dark text-white pb-24 font-display min-h-screen">
            <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md px-4 pt-12 pb-4 border-b border-border-dark">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-90 transition-transform">
                        <span className="material-icons">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-center uppercase tracking-widest">Notifications</h1>
                    {unreadCount > 0 ? (
                        <button onClick={handleMarkAllRead} className="text-xs text-primary font-semibold hover:underline">
                            Mark all read
                        </button>
                    ) : (
                        <div className="w-10"></div>
                    )}
                </div>
                <div className="flex p-1 bg-surface-dark rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${filter === 'all' ? 'bg-primary text-slate-900 shadow-md' : 'text-slate-500'}`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${filter === 'unread' ? 'bg-primary text-slate-900 shadow-md' : 'text-slate-500'}`}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>
            </header>

            <main className="px-4 mt-2">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <span className="material-icons text-5xl mb-2">notifications_off</span>
                        <p className="text-sm uppercase tracking-widest font-bold">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {filter === 'unread' ? 'You have no unread notifications' : "We'll let you know when something happens"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-dark">
                        {filteredNotifications.map(notif => {
                            const { icon, color, bg } = getIcon(notif.type);
                            return (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 py-4 cursor-pointer hover:bg-white/5 -mx-4 px-4 rounded-xl transition-colors group ${!notif.read ? 'bg-white/[0.02]' : 'opacity-60'}`}
                                >
                                    <div
                                        onClick={() => handleNotificationTap(notif)}
                                        className="flex items-start gap-3 flex-1 min-w-0"
                                    >
                                        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center ${color} shrink-0 mt-0.5`}>
                                            <span className="material-icons-round">{icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className={`text-sm font-semibold leading-tight ${!notif.read ? 'text-white' : 'text-slate-400'}`}>
                                                    {notif.title}
                                                </h3>
                                                {!notif.read && (
                                                    <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.body}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">{formatTime(notif.created_at)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 mt-1"
                                    >
                                        <span className="material-icons text-[16px]">close</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav currentScreen={AppScreen.NOTIFICATIONS} onNavigate={onNavigate} />
        </div>
    );
};

export default NotificationsScreen;
