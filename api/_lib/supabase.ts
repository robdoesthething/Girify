/**
 * Supabase admin utilities for user promotion
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ERROR_CODES } from './constants';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase admin client with service role key
 * This bypasses Row Level Security (RLS) policies
 */
function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[Supabase] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('[Supabase] Admin client initialized');
  return supabaseAdmin;
}

/**
 * Promote a user to admin status
 * @param uid Firebase user ID
 * @param username User's username
 * @returns Success status
 */
export async function promoteUserToAdmin(
  uid: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if user is already an admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('uid')
      .eq('uid', uid)
      .single();

    if (checkError && checkError.code !== SUPABASE_ERROR_CODES.NO_ROWS_FOUND) {
      // PGRST116 = no rows returned (user not admin)
      console.error('[Supabase] Error checking admin status:', checkError);
      return { success: false, error: 'Database error checking admin status' };
    }

    if (existingAdmin) {
      console.log(`[Supabase] User ${uid} is already an admin`);
      return { success: true }; // Already admin, consider it success
    }

    // Insert new admin record
    const { error: insertError } = await supabase.from('admins').insert({
      uid,
      username,
      promoted_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('[Supabase] Error inserting admin record:', insertError);
      return { success: false, error: 'Failed to promote user to admin' };
    }

    console.log(`[Supabase] Successfully promoted user ${uid} to admin`);
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Unexpected error promoting user:', error);
    return { success: false, error: 'Unexpected error during promotion' };
  }
}

/**
 * Check if a user is an admin
 * @param uid Firebase user ID
 * @returns True if user is admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.from('admins').select('uid').eq('uid', uid).single();

    if (error && error.code !== SUPABASE_ERROR_CODES.NO_ROWS_FOUND) {
      console.error('[Supabase] Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[Supabase] Unexpected error checking admin status:', error);
    return false;
  }
}

/**
 * Insert a feedback record
 * @param username Normalized username (no @ prefix)
 * @param text Feedback text
 */
export async function insertFeedbackRecord(
  username: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('feedback').insert({ username, text });
    if (error) {
      console.error('[Supabase] feedback insert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('[Supabase] unexpected error inserting feedback:', error);
    return { success: false, error: 'Unexpected error' };
  }
}
