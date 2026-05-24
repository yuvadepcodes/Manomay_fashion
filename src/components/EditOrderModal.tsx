import { useState, useEffect } from 'react';
import { Order } from '../types';
import { X, Calendar, Save, Trash2, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, calculateOrderPriority } from '../api';

import { notificationService } from '../services/notificationService';

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
    // Format dates to YYYY-MM-DD for input fields if they are ISO strings
    const formattedOrder = {
      ...order,
      delivery_date: order.delivery_date?.split('T')[0] || '',
      trial_date: order.trial_date?.split('T')[0] || '',
      cutting_date: order.cutting_date?.split('T')[0] || '',
    };
    setFormData(formattedOrder);
  }, [order]);

  const handleSave = async () => {
    if (!formData.dress_type || !formData.delivery_date) {
      alert('Please fill in dress type and delivery date.');
      return;
    }

    setIsLoading(true);
    
    // Explicitly define what we want to update
    const updatableData: any = {
      dress_type: formData.dress_type,
      quantity: Number(formData.quantity),
      status: formData.status,
      priority: formData.priority,
      delivery_date: formData.delivery_date,
      trial_date: formData.trial_date || null,
      cutting_date: formData.cutting_date || null,
      advance_paid: Number(formData.advance_paid || 0),
      balance_amount: Number(formData.balance_amount || 0),
      notes: formData.notes || ''
    };

    try {
      await api.updateOrder(order.id, updatableData);

      // Trigger notification if status changed to ready or delivered
      if (formData.status !== order.status) {
        if (formData.status === 'ready') {
          notificationService.sendLocalNotification(
            'Order Ready!',
            `${order.customer_name}'s ${order.dress_type} is now ready for pickup.`
          );
        } else if (formData.status === 'delivered') {
          notificationService.sendLocalNotification(
            'Order Delivered',
            `${order.customer_name}'s order has been marked as delivered.`
          );
        }
      }

      onRefresh();
      onClose();
    } catch (error: any) {
      console.error('Update failed:', error);
      const errorMsg = error?.message || error?.details || 'Unknown error';
      alert(`Failed to save changes: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!order.id) {
      alert('Error: Order ID missing');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to delete order:', order.id);
      await api.deleteOrder(order.id);
      console.log('Delete successful');
      onRefresh();
      onClose();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      alert(`Failed to delete order: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
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
            {showDeleteConfirm ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif italic text-stone-800 mb-2">Are you sure?</h3>
                <p className="text-stone-400 text-sm mb-10">This action cannot be undone. All data for this order will be permanently removed.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-4 px-6 rounded-2xl border-2 border-stone-100 text-stone-400 font-bold uppercase tracking-widest text-xs hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 py-4 px-6 rounded-2xl bg-rose-500 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            ) : (
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
                  {/* ... contents of the grid ... */}
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
                    <div className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between">
                      {(() => {
                        const pri = calculateOrderPriority(formData.delivery_date);
                        return (
                          <>
                            <span className="text-stone-500 text-xs">Automated</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                              pri === 'urgent' ? 'bg-rose-50 text-rose-600' :
                              pri === 'high' ? 'bg-amber-50 text-amber-600' :
                              'bg-stone-105 text-stone-550'
                            }`}>
                              {pri}
                            </span>
                          </>
                        );
                      })()}
                    </div>
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
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
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
