
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserOrders } from '../services/ordersService';
import { Order } from '../types';

interface PurchaseHistoryScreenProps {
  onBack: () => void;
}

const PurchaseHistoryScreen: React.FC<PurchaseHistoryScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchUserOrders(user.id);
    setOrders(data);
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const item = order.item as any;
    return item?.title?.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rated': return 'Delivered';
      case 'delivered': return 'Delivered';
      case 'pending': return 'Awaiting Confirmation';
      default: return status;
    }
  };

  return (
    <div className="flex-1 bg-background-dark text-white font-display min-h-screen">
      <header className="px-5 pt-12 mb-6 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dark shadow-lg border border-border-dark active:scale-95 transition-transform">
          <span className="material-icons-round text-primary text-[20px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Purchase History</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-5 pb-28">
        <div className="relative mb-8">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface-dark border-none ring-1 ring-border-dark focus:ring-2 focus:ring-primary text-sm transition-all outline-none text-white placeholder-slate-500"
            placeholder="Search orders..."
            type="text"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <span className="material-icons text-5xl mb-2">receipt_long</span>
            <p className="text-sm uppercase tracking-widest font-bold">No orders found</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Recent Transactions</h2>
              <span className="text-xs font-semibold text-primary">{filteredOrders.length} orders</span>
            </div>

            <div className="space-y-4">
              {filteredOrders.map(order => {
                const item = order.item as any;
                const statusLabel = getStatusLabel(order.status);
                const isAwaiting = order.status === 'pending';

                return (
                  <div key={order.id} className="bg-surface-dark p-4 rounded-2xl border border-border-dark hover:border-primary/40 transition-all cursor-pointer shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-800">
                        <img alt={item?.title || 'Item'} className="h-full w-full object-cover" src={item?.images?.[0] || 'https://picsum.photos/seed/order/100/100'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-base truncate pr-2 text-white">{item?.title || 'Item'}</h3>
                          <span className="font-bold text-lg text-primary">${Number(order.final_price).toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-1">
                          <span className="material-icons-round text-lg text-primary">person</span>
                          {order.seller?.name || 'Seller'}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
                          {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-dark flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAwaiting ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isAwaiting ? 'bg-amber-500' : 'bg-primary'}`}></span>
                        {statusLabel}
                      </span>
                      <div className="flex items-center text-primary text-sm font-bold">
                        View Details
                        <span className="material-icons-round text-[18px] ml-0.5">chevron_right</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-10 p-8 rounded-2xl bg-surface-dark border border-border-dark text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <span className="material-icons-round text-4xl text-primary mb-3">support_agent</span>
          <h4 className="font-bold text-lg mb-1 text-white">Need help with an order?</h4>
          <p className="text-sm text-slate-400 mb-6 px-4">Our support team is available 24/7 for college marketplace disputes.</p>
          <button className="w-full py-4 bg-primary text-slate-900 font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all">
            Contact Support
          </button>
        </div>
      </main>
    </div>
  );
};

export default PurchaseHistoryScreen;
