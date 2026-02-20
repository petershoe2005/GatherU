
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Item, Bid } from '../types';
import { fetchBidsForItem, subscribeToBids } from '../services/bidsService';
import { useCountdown } from '../lib/useCountdown';

interface ItemLiveStatusScreenProps {
  item: Item;
  onBack: () => void;
  onEndBidding: () => void;
}

const ItemLiveStatusScreen: React.FC<ItemLiveStatusScreenProps> = ({ item, onBack, onEndBidding }) => {
  const { user } = useAuth();
  const [currentPrice, setCurrentPrice] = useState(item.currentBid);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const isEnded = item.status === 'sold' || item.status === 'ended';
  const countdown = useCountdown(item.ends_at);
  const isUrgent = countdown !== 'Ended' && !countdown.includes('d') && !countdown.includes('h');

  // Load bid history
  useEffect(() => {
    const loadBids = async () => {
      const data = await fetchBidsForItem(item.id);
      setBids(data);
      setLoading(false);

      if (data.length > 0) {
        setCurrentPrice(Number(data[0].amount));
      }
    };
    loadBids();
  }, [item.id]);

  // Only subscribe to realtime updates if auction is still active
  useEffect(() => {
    if (isEnded) return;
    const channel = subscribeToBids(item.id, (payload: any) => {
      const newBid = payload.new as Bid;
      setCurrentPrice(Number(newBid.amount));
      setBids(prev => [newBid, ...prev]);
    });
    return () => {
      channel.unsubscribe();
    };
  }, [item.id, isEnded]);

  // Get unique bidders for avatar row
  const uniqueBidders = bids.reduce((acc, bid) => {
    if (bid.bidder && !acc.find(b => b.id === bid.bidder?.id)) {
      acc.push(bid.bidder);
    }
    return acc;
  }, [] as NonNullable<Bid['bidder']>[]);

  const formatBidTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Calculate price increase from starting price to final price
  const priceIncrease = currentPrice - item.startingPrice;
  const priceIncreasePercent = item.startingPrice > 0 ? ((priceIncrease / item.startingPrice) * 100).toFixed(0) : '0';

  return (
    <div className="flex-1 bg-background-dark text-white min-h-screen font-display">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full bg-surface-dark active:scale-90 transition-transform">
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{isEnded ? 'Bid History' : 'Live Auction'}</h1>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isEnded ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary animate-blink'}`}>
          {isEnded ? 'Ended' : '● Live'}
        </div>
      </header>

      <div className="px-4 space-y-4 pb-24">
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

        {/* Countdown Timer */}
        {!isEnded && item.ends_at && (
          <div className={`rounded-2xl p-5 border text-center transition-colors ${isUrgent
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-surface-dark border-border-dark'
            }`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
              {isUrgent ? '⚡ Ending Soon' : 'Time Remaining'}
            </p>
            <div className={`text-3xl font-black tracking-tight ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {countdown}
            </div>
            {isUrgent && (
              <p className="text-[10px] text-red-400/70 mt-2 font-medium">
                Place your bid before it's too late!
              </p>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-primary">{bids.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Bids</p>
          </div>
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{uniqueBidders.length || item.activeBidders}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Bidders</p>
          </div>
          <div className="bg-surface-dark border border-border-dark rounded-xl p-3 text-center">
            <p className="text-lg font-black text-amber-400">{item.viewCount}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Watching</p>
          </div>
        </div>

        {/* Bidder Avatars Row */}
        {uniqueBidders.length > 0 && (
          <div className="bg-surface-dark border border-border-dark rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {uniqueBidders.slice(0, 5).map((bidder, i) => (
                <div key={bidder.id} className="relative" style={{ zIndex: 5 - i }}>
                  {bidder.avatar_url ? (
                    <img
                      className="w-8 h-8 rounded-full object-cover border-2 border-background-dark"
                      src={bidder.avatar_url}
                      alt={bidder.name}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-amber-500/80 border-2 border-background-dark flex items-center justify-center text-[10px] font-bold text-white">
                      {(bidder.name || 'U')[0]}
                    </div>
                  )}
                </div>
              ))}
              {uniqueBidders.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-background-dark flex items-center justify-center text-[9px] font-bold text-slate-300">
                  +{uniqueBidders.length - 5}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex-1">
              <span className="text-white font-semibold">{uniqueBidders[0]?.name}</span>
              {uniqueBidders.length > 1 && (
                <> and <span className="text-white font-semibold">{uniqueBidders.length - 1} other{uniqueBidders.length > 2 ? 's' : ''}</span></>
              )}
              {' '}placed bids
            </p>
          </div>
        )}

          {/* Final price summary for ended auctions */}
          {isEnded && priceIncrease > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="material-icons-round text-emerald-400">trending_up</span>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider">Final Price Increase</p>
                <p className="text-lg font-black text-emerald-400">+${priceIncrease.toFixed(2)} <span className="text-sm font-bold">({priceIncreasePercent}%)</span></p>
                <p className="text-[10px] text-slate-400">Started at ${item.startingPrice.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Bid Activity Feed */}
          <div className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border-dark bg-slate-800/50 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isEnded ? 'Price History' : 'Bid Activity'}
              </h3>
              <span className="text-[10px] text-slate-500">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bids.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-icons-round text-3xl text-slate-600 mb-2">gavel</span>
                <p className="text-sm text-slate-500 font-medium">No bids placed</p>
              </div>
            ) : (
              <div className="divide-y divide-border-dark max-h-72 overflow-y-auto">
                {bids.slice(0, 15).map((bid, i) => {
                  const prevBid = bids[i + 1];
                  const increase = prevBid ? Number(bid.amount) - Number(prevBid.amount) : Number(bid.amount) - item.startingPrice;
                  return (
                    <div key={bid.id || i} className={`flex items-center gap-3 px-4 py-3 transition-colors ${i === 0 ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}`}>
                      {bid.bidder?.avatar_url ? (
                        <img className="w-9 h-9 rounded-full object-cover border-2 border-border-dark" src={bid.bidder.avatar_url} alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white border-2 border-border-dark">
                          {(bid.bidder?.name || 'U')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">{bid.bidder?.name || 'Anonymous'}</span>
                          {i === 0 && (
                            <span className="text-[8px] font-black uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded-full tracking-wider">
                              {isEnded ? 'Winner' : 'Highest'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{formatBidTime(bid.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm tabular-nums ${i === 0 ? 'text-primary' : 'text-slate-400'}`}>
                          ${Number(bid.amount).toFixed(2)}
                        </span>
                        {increase > 0 && (
                          <p className="text-[10px] text-emerald-400 font-bold">+${increase.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
