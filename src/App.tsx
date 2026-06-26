/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  Search, 
  Settings,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './api';
import { notificationService } from './services/notificationService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Customer, Order, DashboardStats } from './types';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import CustomerList from './components/CustomerList';
import AddOrder from './components/AddOrder';
import Auth from './components/Auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'dashboard' | 'orders' | 'customers' | 'add';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const localEmail = localStorage.getItem('actual_user_email');
    const localMode = localStorage.getItem('local_mode_enabled') === 'true' || !isSupabaseConfigured;
    
    if (localMode) {
      if (localEmail) {
        setSession({ user: { id: 'local-user', email: localEmail } } as any);
      } else {
        setSession(null);
      }
    } else {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          const msg = error.message || '';
          if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('cors')) {
            throw error;
          }
        }
        setSession(session);
      }).catch(err => {
        console.warn('Failed to retrieve session from Supabase, enabling local fallback mode...', err);
        localStorage.setItem('local_mode_enabled', 'true');
        if (localEmail) {
          setSession({ user: { id: 'local-user', email: localEmail } } as any);
        } else {
          setSession(null);
        }
      });
    }

    // Listen for auth changes only if Supabase is configured and not in local mode
    let subscription: any = null;
    if (!localMode) {
      try {
        const res = supabase.auth.onAuthStateChange((_event, session) => {
          const isLocal = localStorage.getItem('local_mode_enabled') === 'true';
          if (session) {
            setSession(session);
          } else if (!isLocal) {
            setSession(null);
          }
        });
        subscription = res.data?.subscription;
      } catch (err) {
        console.warn('Failed to register auth state change listener', err);
      }
    }

    const handleLocalModeChange = () => {
      const email = localStorage.getItem('actual_user_email');
      if (email) {
        setSession({ user: { id: 'local-user', email } } as any);
      } else {
        setSession(null);
      }
    };

    window.addEventListener('local_mode_changed', handleLocalModeChange);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      window.removeEventListener('local_mode_changed', handleLocalModeChange);
    };
  }, []);

  const fetchData = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const [s, o, c] = await Promise.all([
        api.getStats(),
        api.getOrders(),
        api.getCustomers()
      ]);
      if (o.length > 0) {
        console.log('Order structure check:', Object.keys(o[0]));
      }
      setStats(s);
      setOrders(o);
      setCustomers(c);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    if (orders.length > 0) {
      notificationService.checkAndTriggerScheduledNotifications(orders);
      const interval = setInterval(() => {
        notificationService.checkAndTriggerScheduledNotifications(orders);
      }, 5 * 60 * 1000); // Check once every 5 minutes
      return () => clearInterval(interval);
    }
  }, [orders]);

  const handleLogout = async () => {
    localStorage.removeItem('actual_user_email');
    localStorage.removeItem('local_mode_enabled');
    if (isSupabaseConfigured && localStorage.getItem('local_mode_enabled') !== 'true') {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Failed to sign out from Supabase', err);
      }
    }
    setSession(null);
  };

  if (!session) {
    return <Auth />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard stats={stats} orders={orders} onRefresh={fetchData} />;
      case 'orders':
        return <OrderList orders={orders} onRefresh={fetchData} />;
      case 'customers':
        return <CustomerList customers={customers} onRefresh={fetchData} />;
      case 'add':
        return <AddOrder customers={customers} onRefresh={() => { fetchData(); setActiveView('orders'); }} />;
      default:
        return <Dashboard stats={stats} orders={orders} onRefresh={fetchData} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-warm-off-white flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-stone-200 flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-brand-olive italic text-center">Manomay</h1>
          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1 text-center">Ladies Tailoring Studio</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarButton 
            active={activeView === 'dashboard'} 
            icon={LayoutDashboard} 
            label="Dashboard" 
            onClick={() => setActiveView('dashboard')} 
          />
          <SidebarButton 
            active={activeView === 'orders'} 
            icon={Clock} 
            label="Work Orders" 
            onClick={() => setActiveView('orders')} 
          />
          <SidebarButton 
            active={activeView === 'customers'} 
            icon={Users} 
            label="Client Base" 
            onClick={() => setActiveView('customers')} 
          />
        </nav>

        <div className="p-6 space-y-4">
          <button 
            onClick={() => setActiveView('add')}
            className="w-full bg-brand-olive text-white py-4 rounded-3xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-xs"
          >
            <PlusCircle className="w-5 h-5" />
            New Order
          </button>
          
          {localStorage.getItem('actual_user_email') && (
            <div className="text-center pt-2 pb-1 border-t border-stone-100">
              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Logged in as</p>
              <p className="text-[11px] font-medium text-stone-600 truncate px-2" title={localStorage.getItem('actual_user_email') || ''}>
                {localStorage.getItem('actual_user_email')}
              </p>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-stone-400 hover:text-rose-500 transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {localStorage.getItem('local_mode_enabled') === 'true' && (
          <div className="bg-amber-50 border-b border-amber-200/50 px-6 py-3 flex items-center justify-between text-amber-800 text-[11px] font-medium sticky top-0 z-40 backdrop-blur-md">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Running in local-only fallback mode. All entries and changes are saved securely to your device.
            </span>
            <button 
              onClick={() => {
                localStorage.removeItem('local_mode_enabled');
                window.location.reload();
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
            >
              Retry Cloud Sync
            </button>
          </div>
        )}

        {/* Mobile-Only Header */}
        <header className="md:hidden p-6 sticky top-0 bg-brand-warm-off-white/80 backdrop-blur-md z-40 border-b border-stone-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif font-semibold tracking-tight text-brand-olive italic text-left">Manomay</h1>
              {localStorage.getItem('actual_user_email') && (
                <p className="text-[9px] text-stone-500 font-semibold tracking-wide text-left mt-0.5 truncate max-w-[200px]">
                  Active: {localStorage.getItem('actual_user_email')}
                </p>
              )}
            </div>
            <button onClick={handleLogout} className="p-2 text-stone-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12 md:max-w-6xl md:mx-auto w-full pb-24 md:pb-12">
          {isLoading && !stats && activeView === 'dashboard' ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-olive animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-3 flex justify-between items-center z-50">
        <NavButton 
          active={activeView === 'dashboard'} 
          icon={LayoutDashboard} 
          label="Home" 
          onClick={() => setActiveView('dashboard')} 
        />
        <NavButton 
          active={activeView === 'orders'} 
          icon={Clock} 
          label="Orders" 
          onClick={() => setActiveView('orders')} 
        />
        <button 
          onClick={() => setActiveView('add')}
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-brand-olive text-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-brand-warm-off-white active:scale-95 transition-transform"
        >
          <PlusCircle className="w-8 h-8" />
        </button>
        <NavButton 
          active={activeView === 'customers'} 
          icon={Users} 
          label="Clients" 
          onClick={() => setActiveView('customers')} 
        />
        <NavButton 
          active={false} 
          icon={Search} 
          label="Search" 
          onClick={() => setActiveView('orders')}
        />
      </nav>
    </div>
  );
}

function SidebarButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-medium text-sm",
        active 
          ? "bg-brand-cream text-brand-olive shadow-sm" 
          : "text-stone-500 hover:bg-stone-50"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-brand-olive" : "text-stone-400")} />
      {label}
    </button>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-brand-olive" : "text-stone-400"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-glow" className="w-1 h-1 rounded-full bg-brand-olive mt-0.5" />}
    </button>
  );
}

