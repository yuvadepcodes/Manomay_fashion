import { useState } from 'react';
import { Customer, Order } from '../types';
import { api, calculateOrderPriority } from '../api';
import { Search, UserPlus, Phone, Package, Calendar, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface AddOrderProps {
  customers: Customer[];
  onRefresh: () => void;
}

export default function AddOrder({ customers, onRefresh }: AddOrderProps) {
  const [step, setStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [orderData, setOrderData] = useState({
    dress_type: '',
    quantity: 1,
    priority: 'normal' as const,
    cutting_date: '',
    delivery_date: '',
    notes: '',
    advance_paid: 0,
    balance_amount: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let customerId = selectedCustomerId;
      
      if (!customerId && newCustomer.name) {
        const c = await api.createCustomer(newCustomer);
        customerId = c.id;
      }

      if (customerId) {
        await api.createOrder({
          ...orderData,
          customer_id: customerId
        });
        onRefresh();
      }
    } catch (error) {
      console.error("Submit failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(newCustomer.name.toLowerCase()) || 
    c.phone.includes(newCustomer.phone)
  ).slice(0, 3);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-semibold text-stone-800 italic">New Order</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Step {step} of 3</span>
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-brand-olive' : 'bg-stone-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="relative">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Customer Name</label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Ex: Mrs. Sharma" 
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={newCustomer.name}
                onChange={(e) => {
                  setNewCustomer({ ...newCustomer, name: e.target.value });
                  setSelectedCustomerId('');
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && newCustomer.name && !selectedCustomerId && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-2xl p-2 z-50 border border-stone-100 mt-2 max-h-48 overflow-y-auto">
                  <p className="text-[9px] uppercase font-bold text-stone-300 px-3 py-1">Existing Clients</p>
                  {filteredCustomers.map(c => (
                    <button 
                      key={c.id} 
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand-cream flex justify-between items-center transition-colors mb-1 last:mb-0"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setNewCustomer({ name: c.name, phone: c.phone });
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-800">{c.name}</p>
                        <p className="text-[10px] text-stone-400">{c.phone}</p>
                      </div>
                      <Check className="w-4 h-4 text-brand-olive" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+91 XXXX XXX XXX" 
              className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>

          <button 
            disabled={!newCustomer.name || !newCustomer.phone}
            onClick={handleNext}
            className="w-full bg-brand-olive text-white py-4 rounded-full font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 active:scale-95 transition-transform mt-4"
          >
            Continue
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Dress Type</label>
              <input 
                type="text" 
                placeholder="Ex: Kurti with Palazo" 
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={orderData.dress_type}
                onChange={(e) => setOrderData({ ...orderData, dress_type: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Quantity</label>
              <input 
                type="number" 
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={orderData.quantity}
                onChange={(e) => setOrderData({ ...orderData, quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Priority</label>
              <div className="w-full bg-stone-50 border border-stone-100 px-5 py-4 rounded-3xl text-sm font-medium flex items-center justify-between">
                <span className="text-stone-500">Calculated Automatically</span>
                {(() => {
                  const pri = calculateOrderPriority(orderData.delivery_date);
                  return (
                    <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      pri === 'urgent' ? 'bg-rose-50 text-rose-600' :
                      pri === 'high' ? 'bg-amber-50 text-amber-600' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {pri}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Cutting Schedule</label>
              <input 
                type="date" 
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={orderData.cutting_date}
                onChange={(e) => setOrderData({ ...orderData, cutting_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Delivery Date</label>
              <input 
                type="date" 
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={orderData.delivery_date}
                onChange={(e) => setOrderData({ ...orderData, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={handleBack} className="flex-1 border border-stone-200 py-4 rounded-full font-bold uppercase tracking-widest text-stone-500">Back</button>
            <button onClick={handleNext} className="flex-[2] bg-brand-olive text-white py-4 rounded-full font-bold uppercase tracking-widest shadow-lg">Next</button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="p-6 bg-stone-50 rounded-[2.5rem] border border-stone-100 space-y-4">
            <h3 className="font-serif italic text-lg text-stone-700">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Client</span>
              <span className="font-medium">{newCustomer.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Items</span>
              <span className="font-medium">{orderData.quantity}x {orderData.dress_type}</span>
            </div>
            {orderData.cutting_date && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Cutting Date</span>
                <span className="font-semibold text-stone-700">
                  {(() => {
                    const date = new Date(orderData.cutting_date);
                    if (isNaN(date.getTime())) return '-';
                    const d = date.getDate().toString().padStart(2, '0');
                    const m = (date.getMonth() + 1).toString().padStart(2, '0');
                    const y = date.getFullYear();
                    return `${d}/${m}/${y}`;
                  })()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Due Date</span>
              <span className="font-bold text-brand-olive">
                {(() => {
                  const date = new Date(orderData.delivery_date);
                  if (isNaN(date.getTime())) return '-';
                  const d = date.getDate().toString().padStart(2, '0');
                  const m = (date.getMonth() + 1).toString().padStart(2, '0');
                  const y = date.getFullYear();
                  return `${d}/${m}/${y}`;
                })()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Advance Paid</label>
              <input 
                type="number" 
                placeholder="₹"
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={orderData.advance_paid}
                onChange={(e) => setOrderData({ ...orderData, advance_paid: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-2">Balance</label>
              <input 
                type="number" 
                placeholder="₹"
                className="w-full bg-white px-5 py-4 rounded-3xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                value={orderData.balance_amount}
                onChange={(e) => setOrderData({ ...orderData, balance_amount: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={handleBack} className="flex-1 border border-stone-200 py-4 rounded-full font-bold uppercase tracking-widest text-stone-500">Back</button>
            <button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="flex-[2] bg-brand-olive text-white py-4 rounded-full font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? "Saving..." : "Confirm order"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
