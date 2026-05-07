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
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
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
    
    // Flatten the customer data for compatibility with current UI
    return (data || []).map(order => ({
      ...order,
      customer_name: order.customers?.name,
      customer_phone: order.customers?.phone
    }));
  },
  
  createOrder: async (order: Partial<Order>): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
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

  // Stats - calculated client-side to simplify for now or use Supabase RPC if needed
  getStats: async (): Promise<DashboardStats> => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, delivery_date');
    
    if (error) throw error;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return {
      pending: orders.filter(o => o.status === 'pending').length,
      in_progress: orders.filter(o => ['cutting', 'stitching', 'trial'].includes(o.status)).length,
      ready: orders.filter(o => o.status === 'ready').length,
      overdue: orders.filter(o => o.status !== 'delivered' && new Date(o.delivery_date) < now && o.delivery_date !== todayStr).length,
      due_today: orders.filter(o => o.status !== 'delivered' && o.delivery_date === todayStr).length,
    };
  },
};
