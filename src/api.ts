import { supabase } from './lib/supabase';
import { Customer, Order, DashboardStats } from './types';

const METADATA_SEPARATOR = '---Metadata---';

const packOrder = (order: any) => {
  const { trial_date, cutting_date, balance_amount, ...rest } = order;
  const metadata = { trial_date, cutting_date, balance_amount };
  
  // Strip any existing metadata from notes
  let cleanNotes = (rest.notes || '').split(METADATA_SEPARATOR)[0].trim();
  
  if (trial_date || cutting_date || balance_amount !== undefined) {
    return {
      ...rest,
      notes: `${cleanNotes}\n\n${METADATA_SEPARATOR}\n${JSON.stringify(metadata)}`
    };
  }
  return rest;
};

export const calculateOrderPriority = (deliveryDateStr?: string): 'normal' | 'high' | 'urgent' => {
  if (!deliveryDateStr) return 'normal';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDateStr);
  delivery.setHours(0, 0, 0, 0);
  
  const diffTime = delivery.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 2) {
    return 'urgent';
  } else if (diffDays <= 5) {
    return 'high';
  } else {
    return 'normal';
  }
};

const unpackOrder = (order: any) => {
  if (!order) return order;
  
  const automatedPriority = calculateOrderPriority(order.delivery_date);
  let result = { ...order, priority: automatedPriority };
  
  if (!order.notes) return result;
  
  const parts = order.notes.split(METADATA_SEPARATOR);
  if (parts.length < 2) return result;
  
  try {
    const metadata = JSON.parse(parts[1].trim());
    return {
      ...result,
      notes: parts[0].trim(),
      ...metadata,
      priority: automatedPriority
    };
  } catch (e) {
    console.warn('Failed to parse metadata from notes', e);
    return result;
  }
};

import { isSupabaseConfigured } from './lib/supabase';

const isLocalMode = (): boolean => {
  return !isSupabaseConfigured || localStorage.getItem('local_mode_enabled') === 'true';
};

// Helper for local customers
const getLocalCustomers = (): Customer[] => {
  const stored = localStorage.getItem('manomay_local_customers');
  if (stored) {
    try { 
      return JSON.parse(stored); 
    } catch (e) { 
      console.error('Failed to parse local customers', e); 
    }
  }
  return [];
};

const saveLocalCustomers = (customers: Customer[]) => {
  localStorage.setItem('manomay_local_customers', JSON.stringify(customers));
};

// Helper for local orders
const getLocalOrders = (): Order[] => {
  const stored = localStorage.getItem('manomay_local_orders');
  if (stored) {
    try {
      const orders = JSON.parse(stored);
      return orders.map((o: any) => unpackOrder(o));
    } catch (e) {
      console.error('Failed to parse local orders', e);
    }
  }
  return [];
};

const saveLocalOrders = (orders: Order[]) => {
  localStorage.setItem('manomay_local_orders', JSON.stringify(orders));
};

export const api = {
  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    if (isLocalMode()) {
      return getLocalCustomers();
    }
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.warn("Supabase getCustomers failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      return getLocalCustomers();
    }
  },
  
  createCustomer: async (customer: Partial<Customer>): Promise<Customer> => {
    if (isLocalMode()) {
      const customers = getLocalCustomers();
      const newCustomer: Customer = {
        id: 'cust_' + Math.random().toString(36).substring(2, 11),
        name: customer.name || '',
        phone: customer.phone || '',
        measurements: customer.measurements || '',
        created_at: new Date().toISOString(),
      };
      customers.unshift(newCustomer);
      saveLocalCustomers(customers);
      return newCustomer;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customer, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn("Supabase createCustomer failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      return api.createCustomer(customer);
    }
  },
  
  // Orders
  getOrders: async (): Promise<Order[]> => {
    if (isLocalMode()) {
      return getLocalOrders();
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, phone)')
        .order('delivery_date', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(order => {
        const unpacked = unpackOrder(order);
        return {
          ...unpacked,
          customer_name: order.customers?.name,
          customer_phone: order.customers?.phone
        };
      });
    } catch (err: any) {
      console.warn("Supabase getOrders failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      return getLocalOrders();
    }
  },
  
  createOrder: async (order: Partial<Order>): Promise<Order> => {
    if (isLocalMode()) {
      const orders = getLocalOrders();
      const customers = getLocalCustomers();
      const customer = customers.find(c => c.id === order.customer_id);
      
      const newOrder: Order = {
        id: 'ord_' + Math.random().toString(36).substring(2, 11),
        customer_id: order.customer_id || '',
        customer_name: customer?.name || order.customer_name || 'Walk-in Customer',
        customer_phone: customer?.phone || order.customer_phone || '',
        dress_type: order.dress_type || '',
        quantity: order.quantity || 1,
        delivery_date: order.delivery_date || new Date().toISOString().split('T')[0],
        status: order.status || 'pending',
        priority: calculateOrderPriority(order.delivery_date),
        advance_paid: order.advance_paid || 0,
        balance_amount: order.balance_amount || 0,
        notes: order.notes || '',
        created_at: new Date().toISOString(),
        trial_date: order.trial_date,
        cutting_date: order.cutting_date,
      };
      
      orders.push(newOrder);
      orders.sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime());
      saveLocalOrders(orders);
      return newOrder;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const packed = packOrder(order);
      const { data, error } = await supabase
        .from('orders')
        .insert([{ ...packed, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return unpackOrder(data);
    } catch (err: any) {
      console.warn("Supabase createOrder failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      return api.createOrder(order);
    }
  },
  
  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    if (isLocalMode()) {
      const orders = getLocalOrders();
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Order not found');
      
      const current = orders[index];
      const delivery_date = updates.delivery_date !== undefined ? updates.delivery_date : current.delivery_date;
      const priority = calculateOrderPriority(delivery_date);
      const advance_paid = updates.advance_paid !== undefined ? updates.advance_paid : current.advance_paid;
      const balance_amount = updates.balance_amount !== undefined ? updates.balance_amount : current.balance_amount;

      const updated: Order = {
        ...current,
        ...updates,
        priority,
        advance_paid,
        balance_amount
      };
      
      orders[index] = updated;
      saveLocalOrders(orders);
      return updated;
    }
    try {
      console.log(`API: Updating order ${id}`, updates);
      let packed = updates;
      if ('trial_date' in updates || 'cutting_date' in updates || 'notes' in updates) {
        packed = packOrder(updates);
      }

      const { data, error } = await supabase
        .from('orders')
        .update(packed)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('API Update Error:', error);
        throw error;
      }
      console.log('API Update Success:', data);
      return unpackOrder(data);
    } catch (err: any) {
      console.warn("Supabase updateOrder failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      return api.updateOrder(id, updates);
    }
  },

  deleteOrder: async (id: string): Promise<void> => {
    if (isLocalMode()) {
      const orders = getLocalOrders();
      const filtered = orders.filter(o => o.id !== id);
      saveLocalOrders(filtered);
      return;
    }
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err: any) {
      console.warn("Supabase deleteOrder failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      const orders = getLocalOrders();
      const filtered = orders.filter(o => o.id !== id);
      saveLocalOrders(filtered);
    }
  },

  // Stats
  getStats: async (): Promise<DashboardStats> => {
    if (isLocalMode()) {
      const orders = getLocalOrders();
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
    }
    try {
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
    } catch (err: any) {
      console.warn("Supabase getStats failed, falling back to local mode", err);
      localStorage.setItem('local_mode_enabled', 'true');
      window.dispatchEvent(new Event('local_mode_changed'));
      return api.getStats();
    }
  },
};
