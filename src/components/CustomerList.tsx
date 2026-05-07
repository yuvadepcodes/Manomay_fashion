import { useState } from 'react';
import { Customer } from '../types';
import { Search, Phone, UserPlus, MapPin, ChevronRight, History, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface CustomerListProps {
  customers: Customer[];
  onRefresh: () => void;
}

export default function CustomerList({ customers, onRefresh }: CustomerListProps) {
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-semibold text-stone-800 italic">Clients</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-cream border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest text-brand-olive active:scale-95 transition-transform">
          <UserPlus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input 
          type="text" 
          placeholder="Lookup by name or phone..." 
          className="w-full bg-white pl-12 pr-4 py-3 rounded-full border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={customer.id}
            className="bg-white p-5 rounded-[2rem] border border-stone-50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-olive font-serif text-xl border border-stone-100">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-medium text-stone-800">{customer.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <p className="text-xs text-stone-500 font-medium">{customer.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="p-2.5 rounded-full bg-stone-50 text-stone-400 hover:bg-brand-cream hover:text-brand-olive transition-colors">
                <History className="w-4 h-4" />
              </button>
              <button className="p-2.5 rounded-full bg-stone-50 text-stone-400 hover:bg-brand-cream hover:text-brand-olive transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-stone-100">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-stone-200" />
            </div>
            <p className="text-stone-400 font-serif italic text-sm px-10">No clients registered under this name or number.</p>
          </div>
        )}
      </div>
    </div>
  );
}
