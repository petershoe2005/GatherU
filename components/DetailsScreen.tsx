
import React, { useState, useEffect, useRef } from 'react';
import { Item, Bid } from '../types';
import { useAuth } from '../contexts/useAuth';
import { placeBid } from '../services/bidsService';
import { fetchBidsForItem, subscribeToBids } from '../services/bidsService';
import { incrementViewCount } from '../services/itemsService';
import { isFavorited, addFavorite, removeFavorite } from '../services/favoritesService';
import { fetchReviewsForSeller, submitReview, hasUserReviewed, Review } from '../services/reviewsService';
import ReviewModal from './ReviewModal';
import { useCountdown } from '../lib/useCountdown';

interface DetailsScreenProps {
    item: Item;
    onBack: () => void;
    onConfirmDelivery: () => void;
    onViewLive: () => void;
    onEndBidding: () => void;
    onBuyNow?: () => void;
    onMessageSeller?: () => void;
}

const DetailsScreen: React.FC<DetailsScreenProps> = ({ item, onBack, onConfirmDelivery, onViewLive, onEndBidding, onBuyNow, onMessageSeller }) => {
  const { user } = useAuth();
  const [currentBid, setCurrentBid] = useState(item.currentBid);
  const [isBidding, setIsBidding] = useState(false);
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [bidAmount, setBidAmount] = useState(item.currentBid + 5);
  const [selectedImage, setSelectedImage] = useState(0);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [activeBidders, setActiveBidders] = useState(item.activeBidders);
  const [isFav, setIsFav] = useState(false);
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const isEnded = item.status === 'sold' || item.status === 'ended';
  const isOwner = user?.id === item.seller_id;
  const isHousing = item.category === 'housing';
  const countdown = useCountdown(item.ends_at);
  const displayTime = countdown || item.timeLeft;
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50 && item.images.length > 1) {
      if (diff > 0) {
        setSelectedImage(prev => Math.min(prev + 1, item.images.length - 1));
      } else {
        setSelectedImage(prev => Math.max(prev - 1, 0));
      }
    }
  };

  // Check favorite status
  useEffect(() => {
    if (user && item.id) {
      isFavorited(user.id, item.id).then(setIsFav);
      hasUserReviewed(user.id, item.id).then(setAlreadyReviewed);
    }
  }, [user, item.id]);

  // Load seller reviews
  useEffect(() => {
    if (item.seller_id) {
      fetchReviewsForSeller(item.seller_id).then(setSellerReviews);
    }
  }, [item.seller_id]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user) return;
    await submitReview({
      reviewer_id: user.id,
      seller_id: item.seller_id,
      item_id: item.id,
      rating,
      comment,
    });
    setAlreadyReviewed(true);
    setShowReviewModal(false);
    // Refresh reviews
    fetchReviewsForSeller(item.seller_id).then(setSellerReviews);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    const wasFav = isFav;
    setIsFav(!wasFav);
    if (wasFav) {
      await removeFavorite(user.id, item.id);
    } else {
      await addFavorite(user.id, item.id);
    }
  };

  // Track view count (guard against double-fire in strict mode)
  const viewCountedRef = useRef(false);
  useEffect(() => {
    if (item.id && !viewCountedRef.current) {
      viewCountedRef.current = true;
      incrementViewCount(item.id);
    }
  }, [item.id]);

  // Fetch recent bids
  useEffect(() => {
    const loadBids = async () => {
      const bids = await fetchBidsForItem(item.id);
      setRecentBids(bids.slice(0, 5));
    };
    loadBids();
  }, [item.id]);

  // Subscribe to realtime bid updates
  useEffect(() => {
    const channel = subscribeToBids(item.id, (payload: any) => {
      const newBid = payload.new as Bid;
      setCurrentBid(newBid.amount);
      setBidAmount(newBid.amount + 5);
      setRecentBids(prev => [newBid, ...prev].slice(0, 5));
      setActiveBidders(prev => prev + 1);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [item.id]);

  const handlePlaceBid = async () => {
    if (isBidding || isEnded || !user || bidAmount <= currentBid) return;
    setIsBidding(true);

    const bid = await placeBid(item.id, user.id, bidAmount);

    if (bid) {
      setCurrentBid(bid.amount);
      setBidAmount(bid.amount + 5);
      setShowBidSuccess(true);
      setTimeout(() => setShowBidSuccess(false), 3000);
    }
    setIsBidding(false);
  };

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen relative">
      {/* Bid Success Toast */}
      {showBidSuccess && (
        <div className="fixed top-8 left-4 right-4 z-[200] max-w-md mx-auto animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-icons-round text-primary">check_circle</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Bid Placed Successfully!</p>
              <p className="text-[11px] text-slate-400">Your bid of ${bidAmount > currentBid + 5 ? (currentBid).toFixed(2) : currentBid.toFixed(2)} is now the highest.</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div
        className="relative h-72 sm:h-80 bg-slate-900 overflow-hidden"
        onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].screenX; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].screenX; handleSwipe(); }}
      >
        <img className="w-full h-full object-cover transition-opacity duration-300" src={item.images[selectedImage] || item.images[0]} alt={item.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-background-dark/30"></div>

        <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center z-10">
          <button onClick={onBack} className="bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full active:scale-90 transition-transform border border-white/10">
            <span className="material-icons-round text-lg">arrow_back</span>
          </button>
          <div className="flex gap-2">
            <button className="bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full border border-white/10">
              <span className="material-icons-round text-lg">share</span>
            </button>
            <button
              onClick={toggleFavorite}
              className={`backdrop-blur-md p-2.5 rounded-full border transition-all ${isFav ? 'bg-rose-500/80 border-rose-400/30 text-white' : 'bg-black/40 border-white/10 text-white'}`}
            >
              <span className="material-icons-round text-lg">{isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {item.images.length > 1 && (
          <>
            {selectedImage > 0 && (
              <button
                onClick={() => setSelectedImage(prev => prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-90 z-10 border border-white/10"
              >
                <span className="material-icons-round text-lg">chevron_left</span>
              </button>
            )}
            {selectedImage < item.images.length - 1 && (
              <button
                onClick={() => setSelectedImage(prev => prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all active:scale-90 z-10 border border-white/10"
              >
                <span className="material-icons-round text-lg">chevron_right</span>
              </button>
            )}
          </>
        )}

        {/* Image dots */}
        {item.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {item.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === selectedImage ? 'bg-primary w-5' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto pb-36">
        <div className="px-4 pt-5 space-y-5">
          {/* Title & Price */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-tight text-secondary flex-1">{item.title}</h1>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  {isHousing ? 'Rent' : 'Current Bid'}
                </span>
                <span className="text-2xl font-black text-primary">
                  ${(item.buyNowPrice || currentBid).toFixed(0)}
                  {isHousing && <span className="text-sm font-medium text-slate-400">/{item.rent_period || 'mo'}</span>}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center mt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full border border-primary/20">
                {item.category === 'housing' ? (item.housing_type || 'Housing') : (item.category || 'General')}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="material-icons-round text-sm">visibility</span>{item.viewCount} views
              </span>
              {!isHousing && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="material-icons-round text-sm">group</span>{activeBidders} bidders
                </span>
              )}
              {!isHousing && (
                <span className={`flex items-center gap-1 text-xs font-bold ${isEnded || displayTime === 'Ended' ? 'text-red-400' : 'text-orange-400'}`}>
                  <span className="material-icons-round text-sm">schedule</span>{isEnded || displayTime === 'Ended' ? 'Ended' : displayTime + ' left'}
                </span>
              )}
            </div>

            {/* Housing Specific Details */}
            {isHousing && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Least Start</span>
                  <span className="text-sm font-bold text-secondary">{item.lease_start || 'Immediately'}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lease End</span>
                  <span className="text-sm font-bold text-secondary">{item.lease_end || 'Flexible'}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                  <span className="material-icons-round text-primary text-base">chair</span>
                  <span className="text-xs font-bold text-secondary">{item.is_furnished ? 'Furnished' : 'Unfurnished'}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                  <span className="material-icons-round text-primary text-base">bolt</span>
                  <span className="text-xs font-bold text-secondary">{item.utilities_included ? 'Utils Included' : 'Utils Extra'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
          </div>

          {/* Seller Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0">
              <img className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" src={item.seller.avatar || 'https://picsum.photos/seed/default/100/100'} alt={item.seller.name} />
              {item.seller.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-primary p-0.5 rounded-full border-2 border-white">
                  <span className="material-icons text-white text-[10px]">check</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-secondary">{item.seller.name}</h3>
              <p className="text-[11px] text-slate-400">{item.seller.institution || 'University'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-primary font-bold text-xs">★ {item.seller.rating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400">({item.seller.reviewsCount} reviews)</span>
              </div>
            </div>
              <button className="bg-primary/10 text-primary p-2.5 rounded-xl hover:bg-primary/20 transition-colors" onClick={onMessageSeller}>
                <span className="material-icons-round text-lg">chat</span>
              </button>
          </div>

          {/* Recent Bids */}
          {recentBids.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Recent Bids</h3>
              <div className="space-y-2">
                {recentBids.map((bid, i) => (
                  <div key={bid.id || i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 text-xs">
                      {bid.bidder?.name || 'Anonymous'}
                    </span>
                    <span className="font-bold text-primary">${Number(bid.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live bidding link */}
          <button
            onClick={onViewLive}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-icons-round">show_chart</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-secondary">Live Bidding Activity</p>
                <p className="text-[11px] text-slate-400">View price history & charts</p>
              </div>
            </div>
            <span className="material-icons-round text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
          </button>

          {/* Seller Reviews */}
          {sellerReviews.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Seller Reviews</h3>
              <div className="space-y-3">
                {sellerReviews.slice(0, 3).map(review => (
                  <div key={review.id} className="border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <img className="w-6 h-6 rounded-full object-cover" src={review.reviewer_avatar || 'https://picsum.photos/seed/reviewer/50/50'} alt="" />
                        <span className="text-xs font-semibold text-secondary">{review.reviewer_name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`text-[10px] ${s <= review.rating ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-xs text-slate-400 leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 z-40">
        {isOwner ? (
          <div className="flex gap-3">
            <button
              onClick={onEndBidding}
              disabled={isEnded}
              className="flex-1 bg-red-500/10 text-red-500 font-bold py-3.5 rounded-xl border border-red-500/20 disabled:opacity-40"
            >
              {isHousing ? 'Remove Listing' : 'End Auction'}
            </button>
            <button
              onClick={onViewLive}
              className="flex-1 bg-primary text-slate-900 font-bold py-3.5 rounded-xl"
            >
              View Stats
            </button>
          </div>
        ) : isHousing ? (
          /* Housing Contact Button */
          <button
              onClick={onMessageSeller}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
            <span className="material-icons-round text-sm">chat</span>
            Message Landlord
          </button>
        ) : isEnded ? (
          <div className="flex gap-3">
            <button
              onClick={onConfirmDelivery}
              className="flex-1 bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-sm">local_shipping</span>
              Confirm Delivery
            </button>
            {!alreadyReviewed && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="bg-amber-500/10 text-amber-400 font-bold py-4 px-5 rounded-xl border border-amber-500/20 flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-sm">star</span>
                Rate
              </button>
            )}
          </div>
          ) : item.listing_type === 'fixed' ? (
            /* Fixed price only — Buy Now button */
            <button
              onClick={onBuyNow}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-sm">flash_on</span>
              Buy Now — ${item.buyNowPrice?.toFixed(2)}
            </button>
        ) : (
          <div className="space-y-2">
            {/* Auction bidding */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Bid</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                    min={currentBid + 1}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-slate-900"
                  />
                </div>
              </div>
              <button
                onClick={handlePlaceBid}
                disabled={isBidding || bidAmount <= currentBid}
                className="flex-1 bg-primary hover:bg-primary/90 text-slate-900 font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-5"
              >
                {isBidding ? (
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-icons-round text-sm">gavel</span>
                    Place Bid
                  </>
                )}
              </button>
            </div>
            {/* Buy Now option for "both" type */}
              {item.listing_type === 'both' && item.buyNowPrice && (
                <button onClick={onBuyNow} className="w-full bg-blue-500/10 text-blue-400 font-bold py-3 rounded-xl border border-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors">
                <span className="material-icons-round text-sm">flash_on</span>
                Buy Now — ${item.buyNowPrice.toFixed(2)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          sellerName={item.seller.name}
          itemTitle={item.title}
          onSubmit={handleSubmitReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

export default DetailsScreen;
