import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, AlertTriangle } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    setLoading(false);
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
