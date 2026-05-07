import { useState, useEffect } from 'react';
import { Order } from '../types';
import { X, Calendar, Save, Trash2, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function EditOrderModal({ order, isOpen, onClose, onRefresh }: EditOrderModalProps) {
  const [formData, setFormData] = useState<Partial<Order>>(order);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData(order);
  }, [order]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Clean up formData to remove virtual/calculated fields that aren't in Supabase schema
      const { 
        id, 
        user_id, 
        created_at, 
        customer_name, 
        customer_phone, 
        customers, // Remove foreign key object if it exists
        ...cleanData 
      } = formData as any;

      await api.updateOrder(order.id, cleanData);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to update order. Payload:', cleanData);
      console.error('Error details:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setIsLoading(true);
      try {
        await api.deleteOrder(order.id);
        onRefresh();
        onClose();
      } catch (error) {
        console.error('Failed to delete order:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-serif italic text-stone-800">Edit Order</h2>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">
                    {order.customer_name} • {order.dress_type}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Dress Type</label>
                  <input 
                    type="text" 
                    value={formData.dress_type} 
                    onChange={(e) => setFormData({ ...formData, dress_type: e.target.value })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Quantity</label>
                  <input 
                    type="number" 
                    value={formData.quantity} 
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  >
                    {['pending', 'cutting', 'stitching', 'trial', 'ready', 'delivered'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  >
                    {['normal', 'high', 'urgent'].map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <Scissors className="w-3 h-3 text-blue-500" /> Cutting Schedule
                  </label>
                  <input 
                    type="date" 
                    value={formData.cutting_date || ''} 
                    onChange={(e) => setFormData({ ...formData, cutting_date: e.target.value })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-rose-500" /> Delivery Deadline
                  </label>
                  <input 
                    type="date" 
                    value={formData.delivery_date} 
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Trial Date</label>
                  <input 
                    type="date" 
                    value={formData.trial_date || ''} 
                    onChange={(e) => setFormData({ ...formData, trial_date: e.target.value })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1"></div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Advance Paid</label>
                  <input 
                    type="number" 
                    value={formData.advance_paid} 
                    onChange={(e) => setFormData({ ...formData, advance_paid: Number(e.target.value) })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Balance Due</label>
                  <input 
                    type="number" 
                    value={formData.balance_amount || 0} 
                    onChange={(e) => setFormData({ ...formData, balance_amount: Number(e.target.value) })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Notes</label>
                  <textarea 
                    value={formData.notes || ''} 
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="p-4 rounded-2xl border-2 border-stone-100 text-stone-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 transition-all flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-brand-olive text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] md:hover:shadow-xl md:hover:shadow-brand-olive/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Update Order'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
