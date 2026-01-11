import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars. By default dotenv loads from .env in process.cwd()
// If starting from server/ folder, it finds server/.env
dotenv.config();

// Support both standard and VITE_ prefixed variables for easier copy-pasting
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Key in server environment.');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const verifyAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Exception:', err);
    res.status(500).json({ error: 'Internal Server Error during auth' });
  }
};
