
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchMessages, sendMessage, subscribeToMessages, fetchConversationById } from '../services/messagesService';

interface ChatDetailScreenProps {
  conversationId: string | null;
  onBack: () => void;
}

const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ conversationId, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation metadata (other user + item)
  useEffect(() => {
    if (conversationId && user) {
      fetchConversationById(conversationId, user.id).then(setConversation);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = subscribeToMessages(conversationId, (payload: any) => {
      const newMsg = payload.new as ChatMessage;
      setMessages(prev => [...prev, newMsg]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    const data = await fetchMessages(conversationId);
    setMessages(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !conversationId) return;

    const text = newMessage.trim();
    setNewMessage('');

    await sendMessage(conversationId, user.id, text);
    // The realtime subscription will add the message
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const otherUser = conversation?.other_user;
  const chatItem = conversation?.item;

  if (!conversationId) {
    return (
      <div className="flex-1 bg-background-dark flex items-center justify-center">
        <p className="text-slate-400">No conversation selected</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background-dark min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md px-4 py-3 border-b border-border-dark flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            {otherUser?.avatar_url ? (
              <img
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                src={otherUser.avatar_url}
                alt={otherUser.name}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="material-icons-round text-slate-300">person</span>
              </div>
            )}
            {otherUser?.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-primary p-0.5 rounded-full border-2 border-background-dark">
                <span className="material-icons text-white text-[8px]">check</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-white truncate">{otherUser?.name || 'Chat'}</h2>
            {chatItem ? (
              <p className="text-[10px] text-slate-400 truncate">
                Re: {(chatItem as any).title || 'Item'}
              </p>
            ) : (
              <p className="text-[10px] text-primary font-medium">Active</p>
            )}
          </div>
        </div>
        {chatItem && (chatItem as any).images?.[0] && (
          <img
            className="w-9 h-9 rounded-lg object-cover border border-border-dark shrink-0"
            src={(chatItem as any).images[0]}
            alt=""
          />
        )}
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <span className="material-icons-round text-slate-400">more_vert</span>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <span className="material-icons text-4xl mb-2">chat_bubble_outline</span>
            <p className="text-xs text-slate-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const isSystem = msg.type === 'alert' || msg.type === 'bid';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-primary/10 border border-primary/20 text-primary text-xs px-4 py-2 rounded-full font-medium">
                    {msg.type === 'bid' ? '🔨 ' : '⚡ '}{msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'order-last' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl ${isMe
                    ? 'bg-primary text-slate-900 rounded-br-sm'
                    : 'bg-surface-dark border border-border-dark text-white rounded-bl-sm'
                    }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <p className={`text-[10px] text-slate-500 mt-1 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background-dark/90 backdrop-blur-xl border-t border-border-dark p-4">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-full text-slate-400 hover:text-primary transition-colors shrink-0">
            <span className="material-icons-round">add_circle</span>
          </button>
          <div className="flex-1 relative">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-surface-dark border border-border-dark rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary text-white placeholder-slate-500 transition-colors"
              placeholder="Type a message..."
              type="text"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-3 bg-primary rounded-full text-slate-900 active:scale-90 transition-all disabled:opacity-40 shrink-0"
          >
            <span className="material-icons-round text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailScreen;
