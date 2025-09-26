import { createClient } from '@supabase/supabase-js';

// These variables are provided by the Cloudflare Pages environment.
// Ensure they are set in your project's settings.
// FIX: Add type assertion to access Vite environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
