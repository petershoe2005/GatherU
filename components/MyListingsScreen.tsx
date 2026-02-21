
import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { useAuth } from '../contexts/useAuth';
import { fetchMyListings } from '../services/itemsService';
import { supabase } from '../lib/supabase';
import BoostModal from './BoostModal';

interface MyListingsScreenProps {
  onBack: () => void;
  onSelectItem: (item: Item) => void;
  onAddListing: () => void;
}

type TabType = 'Active' | 'Pending' | 'Sold';

const MyListingsScreen: React.FC<MyListingsScreenProps> = ({ onBack, onSelectItem, onAddListing }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Active');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [boostingItem, setBoostingItem] = useState<Item | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchMyListings(user.id);
      setItems(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const activeItems = items.filter(i => i.status === 'active' || i.status === 'winning' || i.status === 'outbid');
  const pendingItems = items.filter(i => i.status === 'ended');
  const soldItems = items.filter(i => i.status === 'sold');

  const displayItems = activeTab === 'Active' ? activeItems
    : activeTab === 'Pending' ? pendingItems
      : soldItems;

  const handleConfirmDelivery = async (item: Item) => {
    setConfirmingId(item.id);
    try {
      await supabase
        .from('items')
        .update({ status: 'sold' })
        .eq('id', item.id);
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'sold' as const } : i
      ));
    } catch (err) {
      console.error('Error confirming delivery:', err);
    }
    setConfirmingId(null);
  };

  const getStatusBadge = (item: Item) => {
    if (activeTab === 'Active') {
      return <div className="absolute top-1 left-1 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">Live</div>;
    }
    if (activeTab === 'Pending') {
      return <div className="absolute top-1 left-1 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">Pending</div>;
    }
    return <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">Sold</div>;
  };

  const getPriceLabel = () => {
    if (activeTab === 'Sold') return 'Sale Price:';
    if (activeTab === 'Pending') return 'Final Price:';
    return 'Current Bid:';
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'Active', label: 'Active', count: activeItems.length },
    { key: 'Pending', label: 'Pending', count: pendingItems.length },
    { key: 'Sold', label: 'Sold', count: soldItems.length },
  ];

  return (
    <div className="flex-1 bg-background-dark text-slate-100 min-h-screen pb-24 font-display">
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md px-4 pt-12 pb-4 border-b border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-start text-slate-400 active:scale-90 transition-transform">
            <span className="material-icons-round">arrow_back_ios</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight uppercase tracking-widest">My Listings</h1>
          <button onClick={onAddListing} className="w-10 h-10 flex items-center justify-end text-primary active:scale-90 transition-transform">
            <span className="material-icons-round">add_circle_outline</span>
          </button>
        </div>
        <div className="flex p-1 bg-surface-dark rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.key ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key
                  ? (tab.key === 'Pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary')
                  : 'bg-slate-600 text-slate-400'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 mt-6">
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {activeTab === 'Pending' ? 'Pending Delivery' : `${activeTab} Listings`} ({displayItems.length})
          </h2>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-icons text-5xl mb-3">
                {activeTab === 'Active' ? 'inventory_2' : activeTab === 'Pending' ? 'local_shipping' : 'sell'}
              </span>
              <p className="text-sm font-bold uppercase tracking-widest">
                {activeTab === 'Active' ? 'No active listings' : activeTab === 'Pending' ? 'No pending deliveries' : 'No sold items yet'}
              </p>
              {activeTab === 'Pending' && (
                <p className="text-[11px] text-slate-500 mt-2 max-w-[200px] mx-auto">
                  Items that end auctioning will appear here until delivery is confirmed
                </p>
              )}
            </div>
          ) : (
            displayItems.map(item => (
              <div key={item.id} className="bg-surface-dark border border-border-dark p-4 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex gap-4 cursor-pointer" onClick={() => onSelectItem(item)}>
                  <div className="relative w-24 h-24 shrink-0">
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover rounded-xl bg-slate-700"
                      src={item.images?.[0] || 'https://via.placeholder.com/96x96?text=No+Image'}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96x96?text=No+Image'; }}
                    />
                    {getStatusBadge(item)}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-base leading-tight mb-1 truncate">{item.title}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400">{getPriceLabel()}</span>
                        <span className="text-lg font-bold text-primary">${item.currentBid.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="material-icons-round text-sm">visibility</span>
                        <span>{item.viewCount} watchers</span>
                      </div>
                      {activeTab === 'Active' && (
                        <div className={`flex items-center gap-1 font-medium ${item.timeLeft.includes('m') ? 'text-orange-500' : 'text-slate-500'}`}>
                          <span className="material-icons-round text-sm">schedule</span>
                          <span>{item.timeLeft} left</span>
                        </div>
                      )}
                      {activeTab === 'Pending' && (
                        <div className="flex items-center gap-1 font-medium text-amber-500">
                          <span className="material-icons-round text-sm">pending_actions</span>
                          <span>Awaiting delivery</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-dark flex gap-3">
                  {activeTab === 'Active' && (
                    <>
                      <button className="flex-1 bg-slate-800 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                        <span className="material-icons-round text-sm">edit</span> Manage
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setBoostingItem(item); }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-colors ${
                          item.is_boosted
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-primary text-background-dark'
                        }`}
                      >
                        <span className="material-icons-round text-sm">rocket_launch</span>
                        {item.is_boosted ? 'Boosted' : 'Boost'}
                      </button>
                    </>
                  )}
                  {activeTab === 'Pending' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectItem(item); }}
                        className="flex-1 bg-slate-800 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                      >
                        <span className="material-icons-round text-sm">chat</span> Contact Buyer
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConfirmDelivery(item); }}
                        disabled={confirmingId === item.id}
                        className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        {confirmingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="material-icons-round text-sm">check_circle</span> Confirm Delivery
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {activeTab === 'Sold' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectItem(item); }}
                      className="flex-1 bg-slate-800 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                    >
                      <span className="material-icons-round text-sm">receipt_long</span> View Details
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Boost Modal */}
      {boostingItem && user && (
        <BoostModal
          itemId={boostingItem.id}
          itemTitle={boostingItem.title}
          sellerId={user.id}
          onClose={() => setBoostingItem(null)}
          onSuccess={() => {
            setBoostingItem(null);
            fetchMyListings(user.id).then(setItems);
          }}
        />
      )}
    </div>
  );
};

export default MyListingsScreen;
