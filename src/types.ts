export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  measurements?: string; // JSON string
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  dress_type: string;
  quantity: number;
  status: 'pending' | 'cutting' | 'stitching' | 'trial' | 'ready' | 'delivered';
  priority: 'normal' | 'high' | 'urgent';
  trial_date?: string;
  cutting_date?: string;
  delivery_date: string;
  notes?: string;
  advance_paid: number;
  balance_amount: number;
  created_at: string;
}

export interface DashboardStats {
  pending: number;
  in_progress: number;
  ready: number;
  overdue: number;
  due_today: number;
}
