
import React, { useState, useEffect } from 'react';
import { Item, AppScreen, dbItemToItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserBids } from '../services/bidsService';
import BottomNav from './BottomNav';

interface BidsScreenProps {
  items: Item[];
  onNavigate: (screen: AppScreen, item?: Item | null) => void;
}

const BidsScreen: React.FC<BidsScreenProps> = ({ items, onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');
  const [userBids, setUserBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserBids();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserBids = async () => {
    if (!user) return;
    setLoading(true);
    const bids = await fetchUserBids(user.id);
    setUserBids(bids);
    setLoading(false);
  };

  const activeBids = userBids.filter((b: any) => b.items?.status === 'active');
  const pastBids = userBids.filter((b: any) => b.items?.status !== 'active');
  const displayBids = activeTab === 'Active' ? activeBids : pastBids;

  return (
    <div className="flex-1 bg-background-light pb-24 font-display">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 pt-12 pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight mb-4 text-center uppercase tracking-widest text-secondary">My Bids</h1>
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('Active')}
            className={`flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all ${activeTab === 'Active' ? 'bg-white text-secondary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Active ({activeBids.length})
          </button>
          <button
            onClick={() => setActiveTab('Past')}
            className={`flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all ${activeTab === 'Past' ? 'bg-white text-secondary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Past ({pastBids.length})
          </button>
        </div>
      </header>

      <main className="px-4 mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayBids.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <span className="material-icons text-5xl mb-2">gavel</span>
            <p className="text-sm uppercase tracking-widest font-bold">No {activeTab.toLowerCase()} bids</p>
            <button
              onClick={() => onNavigate(AppScreen.FEED)}
              className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
            >
              Browse Items
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBids.map((bid: any) => {
              const itemData = bid.items;
              if (!itemData) return null;
              const isHighestBid = bid.amount >= (itemData.current_bid || 0);

              return (
                <div
                  key={bid.id}
                  onClick={() => {
                    const item = dbItemToItem(itemData);
                    onNavigate(AppScreen.DETAILS, item);
                  }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <div className="relative w-20 h-20 shrink-0">
                      <img className="w-full h-full object-cover rounded-xl" src={itemData.images?.[0] || 'https://picsum.photos/seed/bid/100/100'} alt={itemData.title} />
                      <div className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isHighestBid ? 'bg-success/10 text-success border-success/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                        {isHighestBid ? 'Winning' : 'Outbid'}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm leading-tight truncate text-secondary">{itemData.title}</h3>
                        <p className="text-xs text-primary font-bold mt-1">Your bid: ${Number(bid.amount).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="material-icons-round text-xs">schedule</span>
                          {itemData.time_left || 'Ended'}
                        </span>
                        <span className="text-slate-500">Current: ${Number(itemData.current_bid).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav currentScreen={AppScreen.BIDS} onNavigate={onNavigate} />
    </div>
  );
};

export default BidsScreen;
