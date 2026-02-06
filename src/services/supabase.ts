import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing.');
}

/**
 * Custom JWT token for authenticated Supabase requests.
 * When set, all Supabase requests use this token instead of the anon key,
 * enabling RLS ownership checks via `(current_setting('request.jwt.claims')::json ->> 'sub')`.
 */
let _customToken: string | null = null;

/**
 * Set or clear the custom Supabase access token.
 * Called after Firebase login (set) and on logout (clear).
 */
export function setSupabaseAccessToken(token: string | null): void {
  _customToken = token;
}

const originalFetch = globalThis.fetch;

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        if (_customToken) {
          const headers = new Headers(init?.headers);
          headers.set('Authorization', `Bearer ${_customToken}`);
          return originalFetch(input, { ...init, headers });
        }
        return originalFetch(input, init);
      },
    },
  }
);

// Re-export types for convenience
export type { Database } from '../types/supabase';
