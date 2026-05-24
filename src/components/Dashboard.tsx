import { useState } from 'react';
import { Order, DashboardStats } from '../types';
import { notificationService } from '../services/notificationService';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, TrendingUp, Calendar as CalendarIcon, ChevronLeft, Bell, BellOff, Settings, X, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, isPast, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import EditOrderModal from './EditOrderModal';

interface DashboardProps {
  stats: DashboardStats | null;
  orders: Order[];
  onRefresh: () => void;
}

export default function Dashboard({ stats, orders, onRefresh }: DashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notifPermission, setNotifPermission] = useState(notificationService.getPermissionStatus());
  const [selectedGroup, setSelectedGroup] = useState<'in-progress' | 'due-today' | 'overdue' | 'cutting-today' | 'cutting-overdue' | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Dynamic statistics calculations
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysCuttings = orders.filter(o => {
    if (!o.cutting_date) return false;
    const cuttingDate = new Date(o.cutting_date);
    cuttingDate.setHours(0, 0, 0, 0);
    return isSameDay(cuttingDate, today) && ['pending', 'cutting'].includes(o.status);
  });

  const overdueCuttings = orders.filter(o => {
    if (!o.cutting_date) return false;
    const cuttingDate = new Date(o.cutting_date);
    cuttingDate.setHours(0, 0, 0, 0);
    return cuttingDate < today && ['pending', 'cutting'].includes(o.status);
  });

  const inProgressOrders = orders.filter(o => 
    ['cutting', 'stitching', 'trial'].includes(o.status)
  );

  const dueTodayOrders = orders.filter(o => 
    o.status !== 'delivered' && 
    o.delivery_date && 
    isSameDay(new Date(o.delivery_date), today)
  );

  const overdueOrders = orders.filter(o => {
    if (o.status === 'delivered') return false;
    const deliveryDate = new Date(o.delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate < today;
  });

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotifPermission(notificationService.getPermissionStatus());
    if (granted) {
      notificationService.sendLocalNotification(
        'Manomay Notifications Active!',
        'You will now receive alerts for important tailoring deadlines.'
      );
    }
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const priorityOrders = orders
    .filter(o => o.status !== 'delivered')
    .slice(0, 5);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get orders for each day
  const eventsByDay = (day: Date) => ({
    deliveries: orders.filter(o => o.status !== 'delivered' && isSameDay(new Date(o.delivery_date), day)),
    cuttings: orders.filter(o => o.cutting_date && isSameDay(new Date(o.cutting_date), day))
  });

  // Calculate info for the selected group overview list
  let groupOrders: Order[] = [];
  let groupTitle = "";
  let groupColor = "text-stone-800";
  let groupIcon = Clock;

  switch (selectedGroup) {
    case 'in-progress':
      groupOrders = inProgressOrders;
      groupTitle = "In Progress Orders";
      groupColor = "text-amber-800";
      groupIcon = Clock;
      break;
    case 'due-today':
      groupOrders = dueTodayOrders;
      groupTitle = "Orders Due Today";
      groupColor = "text-blue-800";
      groupIcon = TrendingUp;
      break;
    case 'overdue':
      groupOrders = overdueOrders;
      groupTitle = "Overdue Delivery Orders";
      groupColor = "text-rose-800";
      groupIcon = AlertCircle;
      break;
    case 'cutting-today':
      groupOrders = todaysCuttings;
      groupTitle = "Today's Cutting Sessions";
      groupColor = "text-indigo-800";
      groupIcon = Scissors;
      break;
    case 'cutting-overdue':
      groupOrders = overdueCuttings;
      groupTitle = "Overdue Cutting Sessions";
      groupColor = "text-rose-700Style";
      groupIcon = AlertCircle;
      break;
  }

  // Selected date events schedule for calendar integration
  const parsedCalendarDate = selectedCalendarDate || new Date();
  const selectedDateEvents = eventsByDay(parsedCalendarDate);
  const selectedDateDeliveries = selectedDateEvents.deliveries;
  const selectedDateCuttings = selectedDateEvents.cuttings;
  const hasSelectedDateEvents = selectedDateDeliveries.length > 0 || selectedDateCuttings.length > 0;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-medium text-stone-800">Overview</h2>
          {selectedGroup && (
            <button 
              onClick={() => setSelectedGroup(null)}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-650 px-3 py-1 rounded-full font-bold transition-all uppercase tracking-wider"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard 
            label="In Progress" 
            value={inProgressOrders.length} 
            icon={Clock} 
            color="text-amber-600" 
            bg="bg-amber-50"
            active={selectedGroup === 'in-progress'}
            onClick={() => setSelectedGroup(selectedGroup === 'in-progress' ? null : 'in-progress')}
          />
          <StatCard 
            label="Due Today" 
            value={dueTodayOrders.length} 
            icon={TrendingUp} 
            color="text-blue-600" 
            bg="bg-blue-50"
            active={selectedGroup === 'due-today'}
            onClick={() => setSelectedGroup(selectedGroup === 'due-today' ? null : 'due-today')}
          />
          <StatCard 
            label="Overdue" 
            value={overdueOrders.length} 
            icon={AlertCircle} 
            color="text-rose-600" 
            bg="bg-rose-50"
            active={selectedGroup === 'overdue'}
            onClick={() => setSelectedGroup(selectedGroup === 'overdue' ? null : 'overdue')}
          />
          <StatCard 
            label="Today's Cutting" 
            value={todaysCuttings.length} 
            icon={Scissors} 
            color="text-indigo-650" 
            bg="bg-indigo-50"
            active={selectedGroup === 'cutting-today'}
            onClick={() => setSelectedGroup(selectedGroup === 'cutting-today' ? null : 'cutting-today')}
          />
          <StatCard 
            label="Overdue Cutting" 
            value={overdueCuttings.length} 
            icon={AlertCircle} 
            color="text-red-750" 
            bg="bg-rose-100/40"
            active={selectedGroup === 'cutting-overdue'}
            onClick={() => setSelectedGroup(selectedGroup === 'cutting-overdue' ? null : 'cutting-overdue')}
          />
        </div>
      </section>

      {/* Selected Stat Group Details Panel */}
      <AnimatePresence mode="wait">
        {selectedGroup && (
          <motion.section
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="bg-stone-50 rounded-[2.5rem] p-6 border-2 border-dashed border-stone-200/60 overflow-hidden relative shadow-inner"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-serif italic font-semibold text-stone-800 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-olive rounded-full" />
                  {groupTitle}
                </h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                  Active filter list • {groupOrders.length} {groupOrders.length === 1 ? 'order' : 'orders'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedGroup(null)}
                className="text-stone-400 hover:text-stone-700 bg-white shadow-sm hover:shadow-md hover:bg-stone-100 p-2.5 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[48vh] overflow-y-auto pr-1 custom-scrollbar">
              {groupOrders.length > 0 ? (
                groupOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleEditClick(order)}
                    className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transform hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-3">
                        <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                          order.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'stitching' ? 'bg-indigo-50 text-indigo-600' :
                          order.status === 'cutting' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'trial' ? 'bg-amber-50 text-amber-600' :
                          'bg-stone-105 text-stone-550'
                        }`}>
                          {order.status}
                        </span>
                        <div className="flex gap-1.5">
                          {order.priority === 'urgent' && (
                            <span className="text-[8px] tracking-wider uppercase font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 animate-pulse border border-rose-100">
                              Urgent
                            </span>
                          )}
                          {order.priority === 'high' && (
                            <span className="text-[8px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">
                              High
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="font-serif italic font-medium text-stone-800 text-lg leading-tight">{order.customer_name}</h4>
                      <p className="text-xs text-stone-500 mt-1">{order.dress_type} • {order.quantity} qty</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-50 flex justify-between text-[10px] text-stone-400">
                      {order.cutting_date && (
                        <div>
                          <p className="font-bold uppercase tracking-wider text-stone-300">Cut-off</p>
                          <p className="font-semibold text-stone-600 mt-0.5">{format(new Date(order.cutting_date), 'dd/MM/yyyy')}</p>
                        </div>
                      )}
                      <div className="text-right ml-auto">
                        <p className="font-bold uppercase tracking-wider text-stone-300">Deliver By</p>
                        <p className="font-bold text-brand-olive mt-0.5">{format(new Date(order.delivery_date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-stone-100">
                  <p className="text-stone-400 text-sm font-serif italic">No orders currently match this selection</p>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Priority Queue (Interactive Click to Edit) */}
        <section className="md:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-serif font-medium text-stone-800">Priority Queue</h2>
            <span className="text-xs text-stone-400 uppercase tracking-widest font-bold">Touch to Edit</span>
          </div>
          
          <div className="space-y-3">
            {priorityOrders.length > 0 ? (
              priorityOrders.map((order, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={order.id}
                  onClick={() => handleEditClick(order)}
                  className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-[0.98] md:hover:scale-[1.01] md:hover:shadow-md transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-2 h-10 rounded-full ${
                      order.priority === 'urgent' ? 'bg-rose-400' : 
                      order.priority === 'high' ? 'bg-amber-400' : 'bg-stone-200'
                    }`} />
                    <div>
                      <h3 className="font-medium text-stone-800 group-hover:text-brand-olive transition-colors">{order.customer_name}</h3>
                      <p className="text-xs text-stone-400 font-medium whitespace-nowrap"> 
                        {order.dress_type} • <span className="uppercase text-[10px] font-bold text-stone-500">{order.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold uppercase tracking-tighter ${
                      isPast(new Date(order.delivery_date)) && !isToday(new Date(order.delivery_date))
                        ? 'text-rose-500' 
                        : isToday(new Date(order.delivery_date)) 
                          ? 'text-amber-500' 
                          : 'text-stone-450'
                    }`}>
                      {format(new Date(order.delivery_date), 'dd/MM/yyyy')}
                    </p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[9px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </div>
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

        {/* Quick Actions / Interactive Calendar */}
        <section className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'}`}>
                {notifPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-medium text-stone-800">Notification Alerts</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                  {notifPermission === 'granted' ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            {notifPermission !== 'granted' ? (
              <button 
                onClick={handleEnableNotifications}
                className="w-full py-3 bg-brand-cream text-brand-olive rounded-2xl text-[10px] font-bold uppercase tracking-widest md:hover:bg-brand-olive md:hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Settings className="w-3 h-3" />
                Setup Notifications
              </button>
            ) : (
              <p className="text-[10px] text-stone-400 font-serif italic text-center">
                You'll receive push alerts for critical deadlines and trials.
              </p>
            )}
          </div>

          {/* Interactive Date-Picker Calendar Card */}
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
                const { deliveries, cuttings } = eventsByDay(day);
                const hasDeliveries = deliveries.length > 0;
                const hasCuttings = cuttings.length > 0;
                const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div key={i} className="relative group">
                    <button 
                      type="button"
                      onClick={() => setSelectedCalendarDate(day)}
                      className={`w-full aspect-square text-[10px] rounded-full flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-brand-olive text-white shadow-md font-bold ring-2 ring-brand-olive/50' 
                          : isTodayDate 
                            ? 'ring-2 ring-brand-olive/60 text-brand-olive font-extrabold' 
                            : hasDeliveries 
                              ? 'bg-amber-100/70 text-amber-900 font-bold hover:bg-amber-200' 
                              : hasCuttings
                                ? 'bg-blue-100/75 text-blue-900 font-bold hover:bg-blue-200'
                                : 'text-stone-400 hover:bg-stone-100'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                    
                    {/* Badge Indicator Dots */}
                    <div className="absolute top-0 right-0 flex gap-0.5">
                      {hasDeliveries && (
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" title="Delivery" />
                      )}
                      {hasCuttings && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full border border-white" title="Cutting" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile/Laptop-Friendly Interactive Schedule Detail Pane */}
            <div className="mt-6 pt-5 border-t border-stone-105">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Schedule for: {format(parsedCalendarDate, 'dd MMMM yyyy')}
                </span>
                {isToday(parsedCalendarDate) && (
                  <span className="text-[9px] bg-brand-cream text-brand-olive font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                    Today
                  </span>
                )}
              </div>

              {hasSelectedDateEvents ? (
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedDateDeliveries.map(o => (
                    <div 
                      key={`delivery-${o.id}`}
                      onClick={() => handleEditClick(o)}
                      className="bg-stone-50 hover:bg-stone-100 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border border-stone-100 shadow-sm active:scale-98"
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-xs font-semibold text-stone-800 truncate">{o.customer_name}</p>
                        <p className="text-[10px] text-stone-400 font-medium truncate">{o.dress_type}</p>
                      </div>
                      <span className="shrink-0 text-[8px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                        Delivery
                      </span>
                    </div>
                  ))}

                  {selectedDateCuttings.map(o => (
                    <div 
                      key={`cutting-${o.id}`}
                      onClick={() => handleEditClick(o)}
                      className="bg-stone-50 hover:bg-stone-100 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border border-stone-100 shadow-sm active:scale-98"
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-xs font-semibold text-stone-800 truncate">{o.customer_name}</p>
                        <p className="text-[10px] text-stone-400 font-medium truncate">{o.dress_type}</p>
                      </div>
                      <span className="shrink-0 text-[8px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        Cutting
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-stone-50 rounded-2xl border border-stone-100/50">
                  <p className="text-[10px] text-stone-400 font-serif italic">No delivery or cutting scheduled for this date</p>
                </div>
              )}
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

      {/* Edit Order Modal Overlay */}
      {selectedOrder && (
        <EditOrderModal 
          order={selectedOrder}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedOrder(null);
          }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  active, 
  onClick 
}: { 
  label: string, 
  value: number, 
  icon: any, 
  color: string, 
  bg: string, 
  active: boolean, 
  onClick: () => void 
}) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`p-4 rounded-[2rem] ${bg} border transition-all text-left w-full relative group active:scale-[0.97] ${
        active 
          ? 'ring-2 ring-stone-750 border-stone-200 shadow-md scale-[1.01]' 
          : 'border-transparent hover:scale-[1.005]'
      }`}
    >
      <Icon className={`w-5 h-5 ${color} mb-3 group-hover:scale-110 transition-transform`} />
      <div>
        <p className={`text-2xl font-serif font-extrabold ${color}`}>{value}</p>
        <p className="text-[9px] text-stone-500 uppercase tracking-wider font-bold truncate">{label}</p>
      </div>
      {active && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-stone-700 animate-pulse" />
      )}
    </button>
  );
}
