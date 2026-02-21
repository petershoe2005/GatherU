import React, { useState, useEffect, useMemo } from 'react';
import { AppScreen, Item, AppLocation } from '../types';
import { useAuth } from '../contexts/useAuth';
import { subscribeToNotifications, fetchUnreadCount } from '../services/notificationsService';
import { addFavorite, removeFavorite, isFavorited } from '../services/favoritesService';
import { fetchUserInterests, buildFeedSections, FeedSection } from '../services/feedAlgorithm';
import BottomNav from './BottomNav';

interface FeedScreenProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  onNavigate: (screen: AppScreen) => void;
  selectedDistance: number;
  onDistanceChange: (distance: number) => void;
  userLocation: AppLocation;
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

const SECTION_COLORS: Record<string, string> = {
  boosted: 'text-amber-500',
  ending_soon: 'text-orange-500',
  for_you: 'text-violet-500',
  popular: 'text-rose-500',
  new: 'text-emerald-500',
  all: 'text-slate-400',
};

const ItemCard: React.FC<{
  item: Item;
  isFav: boolean;
  isOwn: boolean;
  onSelect: () => void;
  onToggleFav: (e: React.MouseEvent) => void;
}> = ({ item, isFav, isOwn, onSelect, onToggleFav }) => (
  <div
    onClick={onSelect}
    className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
  >
    {/* Boosted ribbon */}
    {item.is_boosted && (
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 z-10" />
    )}

    {/* Image */}
    <div className="aspect-[4/3] bg-slate-100 relative">
      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Distance badge */}
      <div className="absolute top-3 left-3 flex gap-2">
        <span className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-secondary flex items-center gap-1 shadow-sm">
          <span className="material-icons-round text-[10px] text-primary">near_me</span>
          {item.distance}
        </span>
        {item.is_boosted && (
          <span className="bg-amber-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
            <span className="material-icons-round text-[10px]">rocket_launch</span>
            Boosted
          </span>
        )}
        {isOwn && (
          <span className="bg-primary/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
            <span className="material-icons-round text-[10px]">storefront</span>
            Your listing
          </span>
        )}
      </div>

      {/* Favourite */}
      <button
        onClick={onToggleFav}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/50 transition-colors shadow-sm"
      >
        <span className={`material-icons-round text-lg ${isFav ? 'text-red-500' : 'text-white'}`}>
          {isFav ? 'favorite' : 'favorite_border'}
        </span>
      </button>

      {item.category === 'housing' && (
        <div className="absolute bottom-3 right-3 bg-emerald-500 px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm">
          HOUSING
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-4">
      <h3 className="font-bold text-secondary text-base leading-tight mb-1">{item.title}</h3>
      {item.category === 'housing' ? (
        <div className="flex items-end justify-between mt-2">
          <div>
            <div className="text-primary font-black text-xl">
              ${item.buyNowPrice || item.price}
              <span className="text-xs text-slate-400 font-normal ml-1">/{item.rent_period || 'mo'}</span>
            </div>
            <div className="flex gap-2 mt-1 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              <span>{item.housing_type || 'Rental'}</span>
              {item.is_furnished && <span>• Furnished</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Lease Start</div>
            <div className="text-xs font-bold text-slate-700">{item.lease_start || 'ASAP'}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between mt-2">
          <div>
            {item.listing_type === 'fixed' ? (
              <div className="text-primary font-black text-xl">${item.buyNowPrice}</div>
            ) : (
              <>
                <div className="text-primary font-black text-xl">${item.currentBid}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Current Bid</div>
              </>
            )}
          </div>
          <div className="text-right">
            {item.listing_type !== 'fixed' && (
              <div className="text-[10px] text-orange-600 font-bold flex items-center gap-1 justify-end">
                <span className="material-icons-round text-[12px]">schedule</span>
                {item.timeLeft} Left
              </div>
            )}
            <div className="text-[10px] text-slate-500 mt-0.5">{item.activeBidders} Bids</div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const FeedScreen: React.FC<FeedScreenProps> = ({
  items,
  onSelectItem,
  onNavigate,
  selectedDistance,
  onDistanceChange,
  userLocation,
  onOpenMap,
}) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [interestMap, setInterestMap] = useState<Record<string, number>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['boosted', 'ending_soon', 'for_you']));

  useEffect(() => {
    if (user) {
      fetchUnreadCount(user.id).then(setUnreadNotifications);
      fetchUserInterests(user.id).then(setInterestMap);

      const sub = subscribeToNotifications(user.id, () => {
        fetchUnreadCount(user.id).then(setUnreadNotifications);
      });
      return () => { sub.unsubscribe(); };
    }
  }, [user]);

  useEffect(() => {
    if (user && items.length > 0) {
      const checkFavorites = async () => {
        const newFavs = new Set<string>();
        for (const item of items) {
          if (await isFavorited(user.id, item.id)) newFavs.add(item.id);
        }
        setFavorites(newFavs);
      };
      checkFavorites();
    }
  }, [user, items]);

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) return;
    const newFavs = new Set(favorites);
    const wasFav = newFavs.has(itemId);
    wasFav ? newFavs.delete(itemId) : newFavs.add(itemId);
    setFavorites(newFavs);
    wasFav ? await removeFavorite(user.id, itemId) : await addFavorite(user.id, itemId);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter items by category + search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  // Build sections from filtered items
  const sections: FeedSection[] = useMemo(() => {
    return buildFeedSections(filteredItems, interestMap);
  }, [filteredItems, interestMap]);

  // In search mode, skip sections and show flat results
  const isSearching = searchQuery.length > 0;

  return (
    <div className="flex-1 bg-background-light flex flex-col min-h-screen pb-20 font-display">
      {/* Header */}
      <header className="px-4 pt-12 pb-2 flex items-center justify-between sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-secondary tracking-tight">GatherU</span>
          <div
            onClick={onOpenMap}
            className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full px-2 py-1 cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <span className="material-icons-round text-primary text-xs">location_on</span>
            <span className="text-[10px] text-slate-600 font-bold max-w-[80px] truncate">{userLocation.name}</span>
          </div>
        </div>
        <div className="relative cursor-pointer" onClick={() => onNavigate(AppScreen.NOTIFICATIONS)}>
          <span className="material-icons-round text-slate-400 text-2xl hover:text-secondary transition-colors">notifications</span>
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
      </header>

      {/* Search */}
      <div className="px-4 mb-2 pt-2">
        <div className="relative">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder={activeCategory === 'housing' ? 'Search housing...' : 'Search items...'}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-icons-round text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all ${
                activeCategory === cat.id
                  ? 'bg-secondary text-white border-secondary font-bold shadow-md shadow-secondary/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <span className="material-icons-round text-sm">{cat.icon}</span>
              <span className="text-xs tracking-wide">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 pt-2 pb-4 space-y-6">
        {isSearching ? (
          // Flat search results
          <>
            <p className="text-xs text-slate-400 font-semibold">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <span className="material-icons-round text-5xl mb-3 opacity-30">search_off</span>
                <p className="text-sm font-semibold">No items found</p>
              </div>
            ) : (
              <div className="space-y-4">
              {filteredItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isFav={favorites.has(item.id)}
                      isOwn={item.seller_id === user?.id}
                      onSelect={() => onSelectItem(item)}
                      onToggleFav={e => handleToggleFavorite(e, item.id)}
                    />
                ))}
              </div>
            )}
          </>
        ) : sections.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-icons-round text-5xl mb-3 opacity-30">inventory_2</span>
            <p className="text-sm font-semibold">No listings yet</p>
            <p className="text-xs mt-1">Be the first to post something!</p>
          </div>
        ) : (
          sections.map(section => {
            const isExpanded = expandedSections.has(section.id);
            const colorClass = SECTION_COLORS[section.id] || 'text-slate-400';
            const displayItems = isExpanded ? section.items : section.items.slice(0, 4);

            return (
              <div key={section.id}>
                {/* Section Header */}
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-icons-round text-lg ${colorClass}`}>{section.icon}</span>
                    <h2 className="font-black text-sm text-secondary uppercase tracking-wider">{section.title}</h2>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                      {section.items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                    {section.items.length > 4 && (
                      <span>{isExpanded ? 'Show less' : `See all`}</span>
                    )}
                    <span className={`material-icons-round text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Section Items */}
                <div className="space-y-4">
                  {displayItems.map(item => (
                      <ItemCard
                        key={`${section.id}-${item.id}`}
                        item={item}
                        isFav={favorites.has(item.id)}
                        isOwn={item.seller_id === user?.id}
                        onSelect={() => onSelectItem(item)}
                        onToggleFav={e => handleToggleFavorite(e, item.id)}
                      />
                  ))}
                </div>

                {/* Show more inline button */}
                {!isExpanded && section.items.length > 4 && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full mt-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:border-primary/30 hover:text-primary transition-all bg-white"
                  >
                    +{section.items.length - 4} more in {section.title}
                  </button>
                )}
              </div>
            );
          })
        )}
        <div className="h-6" />
      </div>

      <BottomNav currentScreen={AppScreen.FEED} onNavigate={onNavigate} />
    </div>
  );
};

export default FeedScreen;
