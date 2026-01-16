import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Ideally use SERVICE_ROLE_KEY for server-side operations to bypass RLS, 
// using ANON key is okay if policies allow public read/write or strictly controlled via other means.
// For now, we'll try to use the key provided in existing env (likely anon key) 
// but recommended to add SUPABASE_SERVICE_ROLE_KEY to .env for full backend access.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase URL or Key in environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
