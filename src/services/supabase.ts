import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import type { Database } from '../types/supabase';

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Re-export types for convenience
export type { Database } from '../types/supabase';
