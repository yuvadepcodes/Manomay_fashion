import { Order, DashboardStats } from '../types';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, TrendingUp, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { format, isToday, isPast, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { useState } from 'react';

interface DashboardProps {
  stats: DashboardStats | null;
  orders: Order[];
  onRefresh: () => void;
}

export default function Dashboard({ stats, orders, onRefresh }: DashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const priorityOrders = orders
    .filter(o => o.status !== 'delivered')
    .slice(0, 5);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get orders for each day
  const ordersByDay = (day: Date) => {
    return orders.filter(o => o.status !== 'delivered' && isSameDay(new Date(o.delivery_date), day));
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <section>
        <h2 className="text-xl font-serif font-medium mb-4 text-stone-800">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="In Progress" 
            value={stats?.in_progress || 0} 
            icon={Clock} 
            color="text-amber-600" 
            bg="bg-amber-50"
          />
          <StatCard 
            label="Ready" 
            value={stats?.ready || 0} 
            icon={CheckCircle2} 
            color="text-emerald-600" 
            bg="bg-emerald-50"
          />
          <StatCard 
            label="Due Today" 
            value={stats?.due_today || 0} 
            icon={TrendingUp} 
            color="text-blue-600" 
            bg="bg-blue-50"
          />
          <StatCard 
            label="Overdue" 
            value={stats?.overdue || 0} 
            icon={AlertCircle} 
            color="text-rose-600" 
            bg="bg-rose-50"
          />
        </div>
      </section>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Priority Queue */}
        <section className="md:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-serif font-medium text-stone-800">Priority Queue</h2>
            <span className="text-xs text-stone-400 uppercase tracking-widest font-bold">Next 5 Tasks</span>
          </div>
          
          <div className="space-y-3">
            {priorityOrders.length > 0 ? (
              priorityOrders.map((order, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={order.id}
                  className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between group active:scale-[0.98] md:hover:scale-[1.01] transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-2 h-10 rounded-full ${
                      order.priority === 'urgent' ? 'bg-rose-400' : 
                      order.priority === 'high' ? 'bg-amber-400' : 'bg-stone-200'
                    }`} />
                    <div>
                      <h3 className="font-medium text-stone-800">{order.customer_name}</h3>
                      <p className="text-xs text-stone-400 font-medium"> 
                        {order.dress_type} • {order.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold uppercase tracking-tighter ${
                      isPast(new Date(order.delivery_date)) && !isToday(new Date(order.delivery_date))
                        ? 'text-rose-500' 
                        : isToday(new Date(order.delivery_date)) 
                          ? 'text-amber-500' 
                          : 'text-stone-400'
                    }`}>
                      {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                    </p>
                    <ChevronRight className="w-4 h-4 text-stone-300 ml-auto mt-1" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl p-8 text-center">
                <p className="text-stone-400 text-sm font-serif italic">No priority orders at the moment</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions / Calendar */}
        <section className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 border border-stone-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif italic text-lg text-stone-800">Deadlines</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-stone-50 rounded-full">
                  <ChevronLeft className="w-4 h-4 text-stone-400" />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-stone-50 rounded-full">
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-stone-300 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Padding for first day of month */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="h-8" />
              ))}
              
              {calendarDays.map((day, i) => {
                const dayOrders = ordersByDay(day);
                const hasOrders = dayOrders.length > 0;
                
                return (
                  <div key={i} className="relative group">
                    <button 
                      className={`w-full aspect-square text-[10px] rounded-full flex items-center justify-center transition-all ${
                        isToday(day) 
                          ? 'bg-brand-olive text-white shadow-md font-bold' 
                          : hasOrders 
                            ? 'bg-amber-100 text-amber-900 font-bold' 
                            : 'text-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                    {hasOrders && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                    
                    {/* Tooltip on hover */}
                    {hasOrders && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-stone-800 text-white p-2 rounded-xl text-[9px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
                        <p className="font-bold border-b border-white/20 pb-1 mb-1">{dayOrders.length} Delivery</p>
                        {dayOrders.slice(0, 2).map(o => (
                          <p key={o.id} className="truncate">• {o.customer_name}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-brand-olive rounded-[2.5rem] p-8 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-2xl font-serif mb-2 italic">Ready for the day?</h2>
              <p className="text-white/70 text-sm mb-6">Start by checking the cutting list or updating stitching progress.</p>
              <button 
                className="bg-white text-brand-olive px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest active:scale-95 md:hover:bg-brand-cream transition-all"
                onClick={onRefresh}
              >
                Refresh Dashboard
              </button>
            </div>
            <div className="absolute -right-4 -top-8 rotate-12 opacity-10">
              <Clock className="w-48 h-48" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string, value: number, icon: any, color: string, bg: string }) {
  return (
    <div className={`p-4 rounded-[2rem] ${bg} border border-white shadow-sm`}>
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div>
        <p className={`text-2xl font-serif font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{label}</p>
      </div>
    </div>
  );
}
