import React, { useState, useEffect } from 'react';
import { AppScreen, Item } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchItems } from '../services/itemsService';
import { subscribeToNotifications, fetchUnreadCount } from '../services/notificationsService';
import { addFavorite, removeFavorite, isFavorited } from '../services/favoritesService';
import BottomNav from './BottomNav';

interface FeedScreenProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  onNavigate: (screen: AppScreen) => void;
  selectedDistance: number;
  onDistanceChange: (distance: number) => void;
  userLocation: string;
  onOpenMap: () => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid_view' },
  { id: 'tech', name: 'Tech', icon: 'laptop_mac' },
  { id: 'housing', name: 'Housing', icon: 'domain' },
  { id: 'textbooks', name: 'Books', icon: 'menu_book' },
  { id: 'furniture', name: 'Furn.', icon: 'chair' },
  { id: 'apparel', name: 'Wear', icon: 'checkroom' },
];

const FeedScreen: React.FC<FeedScreenProps> = ({
  items,
  onSelectItem,
  onNavigate,
  selectedDistance,
  onDistanceChange,
  userLocation,
  onOpenMap
}) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Subscribe to notifications
  useEffect(() => {
    if (user) {
      fetchUnreadCount(user.id).then(setUnreadNotifications);

      const sub = subscribeToNotifications(user.id, () => {
        fetchUnreadCount(user.id).then(setUnreadNotifications);
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [user]);

  // Check favorites for current items
  useEffect(() => {
    if (user && items.length > 0) {
      const checkFavorites = async () => {
        const newFavs = new Set<string>();
        for (const item of items) {
          if (await isFavorited(user.id, item.id)) {
            newFavs.add(item.id);
          }
        }
        setFavorites(newFavs);
      };
      checkFavorites();
    }
  }, [user, items]);

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) return;

    // Optimistic update
    const newFavs = new Set(favorites);
    const wasFav = newFavs.has(itemId);
    if (wasFav) {
      newFavs.delete(itemId);
    } else {
      newFavs.add(itemId);
    }
    setFavorites(newFavs);

    if (wasFav) {
      await removeFavorite(user.id, itemId);
    } else {
      await addFavorite(user.id, itemId);
    }
  };

  const filteredItems = items
    .filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.currentBid - b.currentBid;
      if (sortBy === 'price_high') return b.currentBid - a.currentBid;
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

  return (
    <div className="flex-1 bg-background-dark flex flex-col min-h-screen pb-20 font-display">
      {/* Header */}
      <header className="px-4 pt-12 pb-2 flex items-center justify-between sticky top-0 z-10 bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">GatherU</span>
          <div
            onClick={onOpenMap}
            className="flex items-center gap-1 bg-surface-dark/50 border border-white/10 rounded-full px-2 py-1 cursor-pointer hover:bg-surface-dark transition-colors"
          >
            <span className="material-icons-round text-primary text-xs">location_on</span>
            <span className="text-[10px] text-gray-300 font-bold max-w-[80px] truncate">{userLocation}</span>
          </div>
        </div>
        <div className="relative cursor-pointer" onClick={() => onNavigate(AppScreen.NOTIFICATIONS)}>
          <span className="material-icons-round text-gray-400 text-2xl hover:text-white transition-colors">notifications</span>
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background-dark"></span>
          )}
        </div>
      </header>

      {/* Search & Sort */}
      <div className="px-4 mb-4 flex gap-2">
        <div className="flex-1 relative">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
          <input
            type="text"
            placeholder={activeCategory === 'housing' ? "Search housing..." : "Search items..."}
            className="w-full bg-surface-dark border-none rounded-2xl py-3 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setSortBy(prev => prev === 'newest' ? 'price_low' : prev === 'price_low' ? 'price_high' : 'newest')}
          className="w-12 h-12 flex items-center justify-center bg-surface-dark rounded-2xl text-gray-400 hover:text-primary transition-colors"
        >
          <span className="material-icons-round">sort</span>
        </button>
      </div>

      {/* Categories */}
      <div className="px-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all ${activeCategory === cat.id
                ? 'bg-primary text-slate-900 border-primary font-bold shadow-lg shadow-primary/20'
                : 'bg-surface-dark text-gray-400 border-white/5 hover:border-white/20'
                }`}
            >
              <span className="material-icons-round text-sm">{cat.icon}</span>
              <span className="text-xs tracking-wide">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="px-4 pt-2 pb-4 space-y-4">
        {activeCategory === 'housing' && filteredItems.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <span className="material-icons-round text-4xl mb-2 opacity-50">domain_disabled</span>
            <p>No housing listings yet.</p>
          </div>
        )}

        {filteredItems.map(item => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="group relative bg-surface-dark rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all active:scale-[0.98]"
          >
            {/* Image */}
            <div className="aspect-[4/3] bg-gray-800 relative">
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

              {/* Top badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                  <span className="material-icons-round text-[10px] text-primary">near_me</span>
                  {item.distance}
                </span>
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => handleToggleFavorite(e, item.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <span className={`material-icons-round text-lg ${favorites.has(item.id) ? 'text-red-500' : 'text-white'}`}>
                  {favorites.has(item.id) ? 'favorite' : 'favorite_border'}
                </span>
              </button>

              {/* Housing specific badges */}
              {item.category === 'housing' && (
                <div className="absolute bottom-3 right-3 bg-emerald-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white">
                  HOUSING
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 relative">
              <h3 className="font-bold text-white text-base leading-tight mb-1">{item.title}</h3>

              {item.category === 'housing' ? (
                // Housing Layout
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <div className="text-primary font-black text-xl">
                      ${item.buyNowPrice || item.price}
                      <span className="text-xs text-gray-400 font-normal ml-1">/{item.rent_period || 'mo'}</span>
                    </div>
                    <div className="flex gap-2 mt-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      <span>{item.housing_type || 'Rental'}</span>
                      {item.is_furnished && <span>• Furnished</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Lease Start</div>
                    <div className="text-xs font-bold text-white">{item.lease_start || 'ASAP'}</div>
                  </div>
                </div>
              ) : (
                // Standard Item Layout
                <div className="flex items-end justify-between mt-2">
                  <div>
                    {item.listing_type === 'fixed' ? (
                      <div className="text-primary font-black text-xl">${item.buyNowPrice}</div>
                    ) : (
                      <>
                        <div className="text-primary font-black text-xl">${item.currentBid}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Current Bid</div>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    {item.listing_type !== 'fixed' && (
                      <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 justify-end">
                        <span className="material-icons-round text-[12px]">schedule</span>
                        {item.timeLeft} Left
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500 mt-0.5">{item.activeBidders} Bids</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading skeleton or empty state spacer */}
        <div className="h-10"></div>
      </div>

      <BottomNav currentScreen={AppScreen.FEED} onNavigate={onNavigate} />
    </div>
  );
};

export default FeedScreen;
