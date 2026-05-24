import { useState } from 'react';
import { Order } from '../types';
import { Search, Filter, ChevronRight, ChevronLeft, CheckCircle2, Circle, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../api';
import EditOrderModal from './EditOrderModal';

interface OrderListProps {
  orders: Order[];
  onRefresh: () => void;
}

const statusColors: any = {
  pending: 'bg-stone-100 text-stone-500',
  cutting: 'bg-blue-100 text-blue-600',
  stitching: 'bg-indigo-100 text-indigo-600',
  trial: 'bg-amber-100 text-amber-600',
  ready: 'bg-emerald-100 text-emerald-600',
  delivered: 'bg-stone-200 text-stone-400',
};

export default function OrderList({ orders, onRefresh }: OrderListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
      o.dress_type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const updateStatus = async (id: string, currentStatus: string, direction: 1 | -1 = 1) => {
    const statusOrder = ['pending', 'cutting', 'stitching', 'trial', 'ready', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = currentIndex + direction;
    
    if (nextIndex >= 0 && nextIndex < statusOrder.length) {
      const nextStatus = statusOrder[nextIndex];
      await api.updateOrder(id, { status: nextStatus as any });
      onRefresh();
    }
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    // If it's already YYYY-MM-DD
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // Fallback
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-semibold text-stone-800 italic">Work Orders</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded-full border border-stone-200 text-stone-400">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input 
          type="text" 
          placeholder="Search by client or dress type..." 
          className="w-full bg-white pl-12 pr-4 py-3 rounded-full border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['all', 'pending', 'cutting', 'stitching', 'trial', 'ready'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border ${
              filter === s ? 'bg-brand-olive border-brand-olive text-white' : 'bg-white border-stone-100 text-stone-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={order.id}
            onClick={() => handleEditClick(order)}
            className="bg-white p-5 rounded-[2rem] border border-stone-50 shadow-sm group flex flex-col justify-between md:hover:shadow-md transition-all cursor-pointer active:scale-95 md:active:scale-[0.98]"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-tighter px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    {order.cutting_date && (
                      <span className="text-[10px] uppercase font-bold tracking-tighter px-2.5 py-1 rounded-full bg-blue-50 text-blue-500 flex items-center gap-1">
                        <Scissors className="w-3 h-3" /> Scheduled
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-800 mt-2">{order.customer_name}</h3>
                  <p className="text-xs text-stone-500">{order.dress_type} • {order.quantity} qty</p>
                </div>
                  <div className="flex gap-2">
                    {order.status !== 'pending' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(order.id, order.status, -1);
                        }}
                        className="w-10 h-10 rounded-full border-2 border-stone-100 flex items-center justify-center text-stone-300 hover:border-brand-olive hover:text-brand-olive transition-colors bg-white/50"
                        title="Previous Status"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(order.id, order.status);
                      }}
                      className="w-10 h-10 rounded-full border-2 border-stone-100 flex items-center justify-center text-stone-300 hover:border-brand-olive hover:text-brand-olive transition-colors bg-white/50"
                      title="Next Status"
                    >
                      {order.status === 'ready' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                  </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-stone-50 mt-4">
              <div 
                className="flex gap-2 items-center px-1 py-1 rounded-full text-stone-400"
                title="Automated Priority Status"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  order.priority === 'urgent' 
                    ? 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]' 
                    : order.priority === 'high'
                      ? 'bg-amber-500'
                      : 'bg-stone-300'
                }`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  order.priority === 'urgent' ? 'text-rose-500' : 
                  order.priority === 'high' ? 'text-amber-600' : 'text-stone-450'
                }`}>{order.priority}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-stone-400 font-bold tracking-tighter">Delivery</span>
                <p className="text-xs font-bold text-stone-600">{formatDate(order.delivery_date)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-stone-200" />
            </div>
            <p className="text-stone-400 font-serif italic text-sm">No orders found matching your search</p>
          </div>
        )}

        {selectedOrder && (
          <EditOrderModal 
            order={selectedOrder}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onRefresh={onRefresh}
          />
        )}
      </div>
    );
}