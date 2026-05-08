import React, { useState } from 'react';
import { X, Save, User, Phone, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddCustomerModal({ isOpen, onClose, onRefresh }: AddCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    measurements: ''
  });

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert('Please fill in at least the name and phone number.');
      return;
    }

    setIsLoading(true);
    try {
      await api.createCustomer({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        measurements: formData.measurements
      });
      onRefresh();
      onClose();
      // Reset form
      setFormData({
        name: '',
        phone: '',
        address: '',
        notes: '',
        measurements: ''
      });
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      alert(`Failed to add client: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
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
                  <h2 className="text-2xl font-serif italic text-stone-800">Add New Client</h2>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">
                    Registration Form
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="space-y-6 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <User className="w-3 h-3" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter client name"
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    placeholder="Enter phone number"
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <textarea 
                    placeholder="Enter client address"
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Initial Measurements
                  </label>
                  <textarea 
                    placeholder="Bust, Waist, Length, etc."
                    value={formData.measurements} 
                    onChange={(e) => setFormData({ ...formData, measurements: e.target.value })}
                    rows={3}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Internal Notes</label>
                  <textarea 
                    placeholder="Special requests or preferences"
                    value={formData.notes} 
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive/20 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl border-2 border-stone-100 text-stone-400 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-[2] bg-brand-olive text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] md:hover:shadow-xl md:hover:shadow-brand-olive/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Register Client'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
