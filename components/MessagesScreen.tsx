
import React, { useState, useEffect } from 'react';
import { AppScreen, Conversation, AppNotification } from '../types';
import { useAuth } from '../contexts/useAuth';
import { fetchConversations } from '../services/messagesService';
import { fetchNotifications, markNotificationRead, deleteNotification } from '../services/notificationsService';
import BottomNav from './BottomNav';

interface MessagesScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onOpenChat: (conversationId: string) => void;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onNavigate, onOpenChat }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chats' | 'alerts'>('chats');
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-switch to alerts tab when navigated from bell icon
  useEffect(() => {
    const tab = sessionStorage.getItem('openTab');
    if (tab === 'alerts') {
      setActiveTab('alerts');
      sessionStorage.removeItem('openTab');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchConversations(user.id);
    setConversations(data);
    setLoading(false);
  };

  const loadNotifications = async () => {
    if (!user) return;
    const data = await fetchNotifications(user.id);
    setNotifications(data);
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDeleteNotif = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'buying') return conv.buyer_id === user?.id;
    if (filter === 'selling') return conv.seller_id === user?.id;
    return true;
  });

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'bid': return { icon: 'gavel', color: 'text-primary' };
      case 'outbid': return { icon: 'trending_down', color: 'text-red-400' };
      case 'message': return { icon: 'chat_bubble', color: 'text-blue-400' };
      case 'sold': return { icon: 'sell', color: 'text-green-400' };
      case 'order': return { icon: 'local_shipping', color: 'text-amber-400' };
      case 'review': return { icon: 'star', color: 'text-amber-400' };
      default: return { icon: 'notifications', color: 'text-slate-400' };
    }
  };

  return (
    <div className="flex-1 bg-background-light pb-24 font-display">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 pt-12 pb-4 border-b border-slate-200">
        {/* Top-level tabs: Chats | Alerts */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${activeTab === 'chats' ? 'bg-white text-secondary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <span className="material-icons-round text-[16px]">chat_bubble</span>
            Chats
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 relative ${activeTab === 'alerts' ? 'bg-white text-secondary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <span className="material-icons-round text-[16px]">notifications</span>
            Alerts
            {unreadNotifs > 0 && activeTab !== 'alerts' && (
              <span className="absolute top-1 right-[25%] min-w-[16px] h-[16px] bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1">
                {unreadNotifs > 99 ? '99+' : unreadNotifs}
              </span>
            )}
          </button>
        </div>

        {/* Sub-filter for chats */}
        {activeTab === 'chats' && (
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(['all', 'buying', 'selling'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all capitalize ${filter === f ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="px-4 mt-2">
        {activeTab === 'chats' ? (
          /* ── Chats Tab ── */
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-icons text-5xl mb-2">chat_bubble_outline</span>
              <p className="text-sm uppercase tracking-widest font-bold">No conversations yet</p>
              <p className="text-xs text-slate-500 mt-1">Start by bidding on an item</p>
              <button
                onClick={() => onNavigate(AppScreen.FEED)}
                className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
              >
                Browse Items
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => onOpenChat(conv.id)}
                  className="flex items-center gap-3 py-4 cursor-pointer hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <img
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                      src={conv.other_user?.avatar_url || 'https://picsum.photos/seed/conv' + conv.id + '/100/100'}
                      alt={conv.other_user?.name || 'User'}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm truncate text-secondary">{conv.other_user?.name || 'Unknown'}</h3>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                    {conv.item && (
                      <p className="text-[10px] text-primary font-medium mt-0.5 truncate">
                        📦 {typeof conv.item === 'object' && conv.item.title ? conv.item.title : 'Item'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Alerts Tab ── */
          notifications.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-icons text-5xl mb-2">notifications_none</span>
              <p className="text-sm uppercase tracking-widest font-bold">You're all caught up</p>
              <p className="text-xs text-slate-500 mt-1">No new alerts at the moment</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {notifications.map(notif => {
                const { icon, color } = getNotifIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && handleMarkRead(notif.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${notif.read
                      ? 'bg-slate-50 opacity-60'
                      : 'bg-white border border-slate-200 hover:border-primary/30 shadow-sm'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${color}`}>
                      <span className="material-icons-round text-lg">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight text-secondary">{notif.title}</p>
                          {notif.body && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.body}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">{formatTime(notif.created_at)}</span>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary rounded-full absolute top-3 right-3"></div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNotif(notif.id); }}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    >
                      <span className="material-icons-round text-sm">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      <BottomNav currentScreen={AppScreen.MESSAGES} onNavigate={onNavigate} />
    </div>
  );
};

export default MessagesScreen;
