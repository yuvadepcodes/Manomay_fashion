import React, { useState, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, AlertTriangle } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // If Supabase is not configured, automatically log in using local offline mode
      if (!isSupabaseConfigured) {
        console.log('Supabase is not configured. Logging in via Local Offline Mode...');
        localStorage.setItem('actual_user_email', email);
        localStorage.setItem('local_mode_enabled', 'true');
        window.location.reload();
        return;
      }

      // 1. Verify user's entered credentials using a non-persistent temporary client
      let authData = null;
      let authError = null;

      try {
        const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        });
        
        const res = await tempSupabase.auth.signInWithPassword({
          email,
          password,
        });
        authData = res.data;
        authError = res.error;
      } catch (fetchErr: any) {
        console.warn('Authentication server unreachable (Failed to fetch). Activating Local Offline Mode...', fetchErr);
        localStorage.setItem('actual_user_email', email);
        localStorage.setItem('local_mode_enabled', 'true');
        window.location.reload();
        return;
      }

      if (authError) {
        const msg = authError.message || '';
        if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('unreachable') || msg.toLowerCase().includes('cors')) {
          console.warn('Authentication server returned fetch/network error. Activating Local Offline Mode...');
          localStorage.setItem('actual_user_email', email);
          localStorage.setItem('local_mode_enabled', 'true');
          window.location.reload();
          return;
        }
        setError(msg);
        setLoading(false);
        return;
      }

      // 2. Success! The user is authenticated. Now sign in the persistent client to the centralized shared workspace account.
      const centralEmail = 'manomay.studio@gmail.com';
      const centralPassword = 'CentralWorkspacePassword2026!#';

      let centralError = null;
      try {
        const res = await supabase.auth.signInWithPassword({
          email: centralEmail,
          password: centralPassword,
        });
        centralError = res.error;
      } catch (fetchErr: any) {
        console.warn('Central database server unreachable. Activating Local Offline Mode...', fetchErr);
        localStorage.setItem('actual_user_email', email);
        localStorage.setItem('local_mode_enabled', 'true');
        window.location.reload();
        return;
      }

      // 3. If central account doesn't exist yet, register/sign it up automatically
      if (centralError) {
        const cMsg = centralError.message || '';
        if (cMsg.toLowerCase().includes('fetch') || cMsg.toLowerCase().includes('network') || cMsg.toLowerCase().includes('unreachable') || cMsg.toLowerCase().includes('cors')) {
          console.warn('Central database returned fetch/network error. Activating Local Offline Mode...');
          localStorage.setItem('actual_user_email', email);
          localStorage.setItem('local_mode_enabled', 'true');
          window.location.reload();
          return;
        }

        console.log('Central shared workspace account does not exist. Provisioning now...');
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email: centralEmail,
            password: centralPassword,
          });

          if (!signUpError) {
            // Retry signing in after signup
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: centralEmail,
              password: centralPassword,
            });
            centralError = retryError;
          } else {
            centralError = signUpError;
          }
        } catch (signUpFetchErr: any) {
          console.warn('Provisioning failed due to network error. Activating Local Offline Mode...');
          localStorage.setItem('actual_user_email', email);
          localStorage.setItem('local_mode_enabled', 'true');
          window.location.reload();
          return;
        }
      }

      if (centralError) {
        const cMsg = centralError.message || '';
        if (cMsg.toLowerCase().includes('fetch') || cMsg.toLowerCase().includes('network') || cMsg.toLowerCase().includes('unreachable') || cMsg.toLowerCase().includes('cors')) {
          console.warn('Central database registration returned fetch/network error. Activating Local Offline Mode...');
          localStorage.setItem('actual_user_email', email);
          localStorage.setItem('local_mode_enabled', 'true');
          window.location.reload();
          return;
        }
        
        console.warn('Central workspace access failed. Falling back to personal account workspace...', cMsg);
        try {
          const { error: personalError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (personalError) {
            throw personalError;
          }
          localStorage.setItem('actual_user_email', email);
          localStorage.removeItem('local_mode_enabled');
          window.location.reload();
          return;
        } catch (personalFallError: any) {
          console.warn('Personal fallback authentication failed, falling back to Local Offline Mode...', personalFallError);
          localStorage.setItem('actual_user_email', email);
          localStorage.setItem('local_mode_enabled', 'true');
          window.location.reload();
          return;
        }
      } else {
        // Save the user's personal email to show in profile or settings
        localStorage.setItem('actual_user_email', email);
        localStorage.removeItem('local_mode_enabled');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during authorization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-warm-off-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-stone-100"
      >
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-brand-cream rounded-full mb-6 border border-stone-100">
            <Lock className="w-8 h-8 text-brand-olive" />
          </div>
          <h1 className="text-4xl font-serif italic text-brand-olive mb-2">Manomay</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-stone-400">Authentic Workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-7">
          {!isSupabaseConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">Configuration Missing</p>
                <p className="text-[10px] text-amber-700 mt-1">Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel environment variables.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-3 px-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                type="email" 
                required
                className="w-full bg-stone-50 border-2 border-transparent focus:border-brand-olive/10 focus:bg-white px-12 py-4 rounded-3xl outline-none transition-all text-sm font-medium"
                placeholder="tailor@stitchflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-3 px-1">Private Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                type="password" 
                required
                className="w-full bg-stone-50 border-2 border-transparent focus:border-brand-olive/10 focus:bg-white px-12 py-4 rounded-3xl outline-none transition-all text-sm font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <p className="text-[11px] text-rose-600 font-bold uppercase tracking-tight">
                {error}
              </p>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-olive text-white py-5 rounded-full font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Studio"}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-stone-50 text-center">
          <p className="text-[10px] text-stone-300 font-medium uppercase tracking-[0.2em]">
            Professional Ladies Tailoring System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
