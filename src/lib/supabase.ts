/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawUrl !== 'https://placeholder.supabase.co' && 
  rawUrl !== 'your_supabase_url' &&
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('http') &&
  rawAnonKey &&
  rawAnonKey !== 'placeholder' &&
  rawAnonKey !== 'your_supabase_anon_key'
);

export const supabaseUrl = isSupabaseConfigured ? (rawUrl?.replace(/\/rest\/v1\/?$/, '') || 'https://placeholder.supabase.co') : 'https://placeholder.supabase.co';
export const supabaseAnonKey = isSupabaseConfigured ? (rawAnonKey || 'placeholder') : 'placeholder';

const isLocalModeEnabled = !isSupabaseConfigured || localStorage.getItem('local_mode_enabled') === 'true';

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: !isLocalModeEnabled,
      autoRefreshToken: !isLocalModeEnabled,
      detectSessionInUrl: !isLocalModeEnabled,
    }
  }
);
