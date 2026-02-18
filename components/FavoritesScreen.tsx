
import React, { useState, useEffect } from 'react';
import { AppScreen, Item, dbItemToItem } from '../types';
import { useAuth } from '../contexts/useAuth';
import { fetchFavoriteItems, removeFavorite } from '../services/favoritesService';
import BottomNav from './BottomNav';

interface FavoritesScreenProps {
    onBack: () => void;
    onNavigate: (screen: AppScreen, item?: Item | null) => void;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onBack, onNavigate }) => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, [user]);

    const loadFavorites = async () => {
        setLoading(true);
        const data = await fetchFavoriteItems(user?.id || null);
        setFavorites(data);
        setLoading(false);
    };

    const handleRemove = async (itemId: string) => {
        setFavorites(prev => prev.filter(f => f.item_id !== itemId));
        await removeFavorite(user?.id || null, itemId);
    };

    return (
        <div className="flex-1 bg-background-dark text-white pb-24 font-display min-h-screen">
            <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md px-4 pt-12 pb-4 border-b border-border-dark">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-90 transition-transform">
                        <span className="material-icons">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-center uppercase tracking-widest">Favorites</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="px-4 mt-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <span className="material-icons text-5xl mb-2">favorite_border</span>
                        <p className="text-sm uppercase tracking-widest font-bold">No favorites yet</p>
                        <p className="text-xs text-slate-500 mt-1">Tap the heart icon on items to save them here</p>
                        <button
                            onClick={() => onNavigate(AppScreen.FEED)}
                            className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
                        >
                            Discover Items
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {favorites.map((fav: any) => {
                            const itemData = fav.items;
                            if (!itemData) return null;

                            return (
                                <div
                                    key={fav.id}
                                    className="bg-surface-dark border border-border-dark rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all"
                                >
                                    <div className="flex gap-3">
                                        <div
                                            className="relative w-20 h-20 shrink-0"
                                            onClick={() => {
                                                const item = dbItemToItem(itemData);
                                                onNavigate(AppScreen.DETAILS, item);
                                            }}
                                        >
                                            <img
                                                className="w-full h-full object-cover rounded-xl"
                                                src={itemData.images?.[0] || 'https://picsum.photos/seed/fav/100/100'}
                                                alt={itemData.title}
                                            />
                                            {itemData.status === 'sold' && (
                                                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white uppercase">Sold</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div
                                                onClick={() => {
                                                    const item = dbItemToItem(itemData);
                                                    onNavigate(AppScreen.DETAILS, item);
                                                }}
                                            >
                                                <h3 className="font-semibold text-sm leading-tight truncate">{itemData.title}</h3>
                                                <p className="text-xs text-primary font-bold mt-1">
                                                    ${Number(itemData.current_bid || itemData.starting_price).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <span className="material-icons-round text-xs">schedule</span>
                                                    {itemData.time_left || 'Ended'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemove(fav.item_id); }}
                                                    className="text-rose-400 hover:text-rose-300 transition-colors"
                                                >
                                                    <span className="material-icons text-lg">favorite</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav currentScreen={AppScreen.FAVORITES} onNavigate={onNavigate} />
        </div>
    );
};

export default FavoritesScreen;
