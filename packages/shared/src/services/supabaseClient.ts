import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase URL or Anon Key in environment variables');
}

// Fallback placeholders prevent createClient() from throwing when this module
// is evaluated in a non-Vite environment (e.g. Next.js SSR). The shared client
// is never actually called in Next.js — web-next uses its own local client.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
