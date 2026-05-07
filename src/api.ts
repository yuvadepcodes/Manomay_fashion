import { supabase } from './lib/supabase';
import { Customer, Order, DashboardStats } from './types';

export const api = {
  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  createCustomer: async (customer: Partial<Customer>): Promise<Customer> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customer, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Orders
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(name, phone)')
      .order('delivery_date', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(order => ({
      ...order,
      customer_name: order.customers?.name,
      customer_phone: order.customers?.phone
    }));
  },
  
  createOrder: async (order: Partial<Order>): Promise<Order> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...order, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, delivery_date');
    
    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return {
      pending: orders.filter(o => o.status === 'pending').length,
      in_progress: orders.filter(o => ['cutting', 'stitching', 'trial'].includes(o.status)).length,
      ready: orders.filter(o => o.status === 'ready').length,
      overdue: orders.filter(o => {
        if (o.status === 'delivered') return false;
        const deliveryDate = new Date(o.delivery_date);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate < today;
      }).length,
      due_today: orders.filter(o => o.status !== 'delivered' && o.delivery_date === todayStr).length,
    };
  },
};
