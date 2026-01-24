/**
 * Blocks Database Operations
 *
 * User blocking functionality.
 */

import { supabase } from '../supabase';

export async function getBlockedUsers(username: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked')
    .eq('blocker', username.toLowerCase());

  if (error) {
    console.error('[DB] getBlockedUsers error:', error.message);
    return [];
  }
  return data?.map(b => b.blocked) || [];
}

export async function isUserBlocked(blocker: string, blocked: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker')
    .eq('blocker', blocker.toLowerCase())
    .eq('blocked', blocked.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('[DB] isUserBlocked error:', error.message);
    return false;
  }
  return !!data;
}

export async function blockUser(blocker: string, blocked: string): Promise<boolean> {
  const { error } = await supabase.from('blocks').insert({
    blocker: blocker.toLowerCase(),
    blocked: blocked.toLowerCase(),
  });

  if (error) {
    console.error('[DB] blockUser error:', error.message);
    return false;
  }
  return true;
}

export async function unblockUser(blocker: string, blocked: string): Promise<boolean> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker', blocker.toLowerCase())
    .eq('blocked', blocked.toLowerCase());

  if (error) {
    console.error('[DB] unblockUser error:', error.message);
    return false;
  }
  return true;
}
