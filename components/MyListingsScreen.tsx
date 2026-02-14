
import React, { useState } from 'react';
import { Item } from '../types';

interface MyListingsScreenProps {
  items: Item[];
  onBack: () => void;
  onSelectItem: (item: Item) => void;
  onAddListing: () => void;
}

const MyListingsScreen: React.FC<MyListingsScreenProps> = ({ items, onBack, onSelectItem, onAddListing }) => {
  const [activeTab, setActiveTab] = useState<'Active' | 'Sold'>('Active');

  const activeItems = items.filter(i => i.status !== 'sold');
  const soldItems = items.filter(i => i.status === 'sold');
  const displayItems = activeTab === 'Active' ? activeItems : soldItems;

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
          <button 
            onClick={() => setActiveTab('Active')}
            className={`flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all ${activeTab === 'Active' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('Sold')}
            className={`flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all ${activeTab === 'Sold' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'}`}
          >
            Sold
          </button>
        </div>
      </header>

      <main className="px-4 mt-6">
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{activeTab} Listings ({displayItems.length})</h2>
        </div>
        
        <div className="space-y-4">
          {displayItems.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <span className="material-icons text-6xl mb-2">inventory_2</span>
              <p className="text-sm font-bold uppercase tracking-widest">No listings found</p>
            </div>
          ) : (
            displayItems.map(item => (
              <div key={item.id} className="bg-surface-dark border border-border-dark p-4 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex gap-4 cursor-pointer" onClick={() => onSelectItem(item)}>
                  <div className="relative w-24 h-24 shrink-0">
                    <img alt={item.title} className="w-full h-full object-cover rounded-xl" src={item.images[0]} />
                    {item.status !== 'sold' && (
                      <div className="absolute top-1 left-1 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">Live</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-base leading-tight mb-1 truncate">{item.title}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400">{activeTab === 'Sold' ? 'Sale Price:' : 'Current Bid:'}</span>
                        <span className="text-lg font-bold text-primary">${item.currentBid.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="material-icons-round text-sm">visibility</span>
                        <span>{item.viewCount} watchers</span>
                      </div>
                      <div className={`flex items-center gap-1 font-medium ${item.timeLeft.includes('m') ? 'text-orange-500' : 'text-slate-500'}`}>
                        <span className="material-icons-round text-sm">schedule</span>
                        <span>{item.timeLeft} {activeTab === 'Active' ? 'left' : 'ago'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-dark flex gap-3">
                  <button className="flex-1 bg-slate-800 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                    <span className="material-icons-round text-sm">edit</span> Manage
                  </button>
                  <button className="px-6 bg-primary text-background-dark py-2.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-primary/90 transition-colors">
                    Boost
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default MyListingsScreen;
