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
    
    return (data || []).map(order => {
      const unpacked = unpackOrder(order);
      return {
        ...unpacked,
        customer_name: order.customers?.name,
        customer_phone: order.customers?.phone
      };
    });
  },
  
  createOrder: async (order: Partial<Order>): Promise<Order> => {
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
  },
  
  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    console.log(`API: Updating order ${id}`, updates);
    // Since this is a partial update, we need to be careful with virtualization.
    // However, in our UI, we usually update most fields at once or status.
    // If trial_date or cutting_date are present, we must pack them.
    
    let packed = updates;
    if ('trial_date' in updates || 'cutting_date' in updates || 'notes' in updates) {
      // For a truly robust partial update of virtualized fields, we would need 
      // to fetch the current order first, but let's try to pack what we have.
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
  },

  deleteOrder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
