import { createClient } from '@supabase/supabase-js';

const _metaEnv = (import.meta as any).env;
const supabaseUrl = _metaEnv?.VITE_SUPABASE_URL;
const supabaseAnonKey = _metaEnv?.VITE_SUPABASE_ANON_KEY;

if (_metaEnv && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('Missing Supabase URL or Anon Key in environment variables');
}

// Fallback placeholders prevent createClient() from throwing when this module
// is evaluated in a non-Vite environment (e.g. Next.js SSR). The shared client
// is never actually called in Next.js — web-next uses its own local client.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
