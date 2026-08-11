import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO MODE — set to true to bypass Supabase and run fully offline with
// localStorage. No login required. Perfect for demos and presentations.
// Set back to false to reconnect to Supabase.
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_MODE = false;

export const isMockSupabase = DEMO_MODE;

if (!DEMO_MODE && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('Supabase credentials missing. Client fallback active for static build.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



