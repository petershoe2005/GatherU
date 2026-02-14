
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Item, Bid } from '../types';
import { fetchBidsForItem, subscribeToBids } from '../services/bidsService';

interface ItemLiveStatusScreenProps {
  item: Item;
  onBack: () => void;
  onEndBidding: () => void;
}

const ItemLiveStatusScreen: React.FC<ItemLiveStatusScreenProps> = ({ item, onBack, onEndBidding }) => {
  const { user } = useAuth();
  const [currentPrice, setCurrentPrice] = useState(item.currentBid);
  const [bids, setBids] = useState<Bid[]>([]);
  const [priceHistory, setPriceHistory] = useState<{ price: number; time: string }[]>([
    { price: item.startingPrice, time: 'Start' }
  ]);
  const [loading, setLoading] = useState(true);
  const isEnded = item.status === 'sold' || item.status === 'ended';

  // Load bid history
  useEffect(() => {
    const loadBids = async () => {
      const data = await fetchBidsForItem(item.id);
      setBids(data);
      setLoading(false);

      // Build price history from bids
      const history = [{ price: item.startingPrice, time: 'Start' }];
      data.reverse().forEach((bid: Bid) => {
        const date = new Date(bid.created_at);
        history.push({
          price: Number(bid.amount),
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      });
      setPriceHistory(history);

      if (data.length > 0) {
        setCurrentPrice(Number(data[0].amount));
      }
    };
    loadBids();
  }, [item.id]);

  // Subscribe to realtime bid updates
  useEffect(() => {
    const channel = subscribeToBids(item.id, (payload: any) => {
      const newBid = payload.new as Bid;
      setCurrentPrice(Number(newBid.amount));
      setBids(prev => [newBid, ...prev]);
      setPriceHistory(prev => [...prev, {
        price: Number(newBid.amount),
        time: new Date(newBid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [item.id]);

  // Simple bar chart
  const maxPrice = Math.max(...priceHistory.map(p => p.price), item.startingPrice + 10);

  return (
    <div className="flex-1 bg-background-dark text-white min-h-screen font-display">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full bg-surface-dark active:scale-90 transition-transform">
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Live Auction</h1>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isEnded ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
          {isEnded ? 'Ended' : '● Live'}
        </div>
      </header>

      <div className="px-4 space-y-6 pb-24">
        {/* Item Summary */}
        <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 flex gap-4">
          <img className="w-16 h-16 rounded-xl object-cover" src={item.images[0]} alt={item.title} />
          <div className="flex-1">
            <h3 className="font-semibold text-sm truncate">{item.title}</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-primary">${currentPrice.toFixed(2)}</span>
              <span className="text-xs text-slate-400">from ${item.startingPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-surface-dark border border-border-dark rounded-2xl p-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Price History</h3>
          <div className="h-40 flex items-end gap-1">
            {priceHistory.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[8px] text-primary font-bold">${point.price.toFixed(0)}</span>
                <div
                  className="w-full bg-primary/30 rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{ height: `${(point.price / maxPrice) * 100}%` }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-primary/50 to-primary rounded-t-md"></div>
                </div>
                <span className="text-[7px] text-slate-500 truncate max-w-full">{point.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-primary">{bids.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Bids</p>
          </div>
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{item.activeBidders}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Bidders</p>
          </div>
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-amber-400">{item.viewCount}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Views</p>
          </div>
        </div>

        {/* Recent Bids */}
        <div className="bg-surface-dark border border-border-dark rounded-2xl p-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Recent Bids</h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : bids.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No bids yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bids.slice(0, 10).map((bid, i) => (
                <div key={bid.id || i} className="flex items-center justify-between py-2 border-b border-border-dark last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                      {(bid.bidder?.name || 'U')[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{bid.bidder?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(bid.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${i === 0 ? 'text-primary' : 'text-slate-400'}`}>
                    ${Number(bid.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* End Auction Button (for owner only) */}
        {!isEnded && user?.id === item.seller_id && (
          <button
            onClick={onEndBidding}
            className="w-full bg-red-500/10 text-red-500 font-bold py-4 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons-round text-lg">cancel</span>
            End Auction Early
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemLiveStatusScreen;
