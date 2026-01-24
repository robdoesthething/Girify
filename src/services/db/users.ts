/**
 * User Database Operations
 *
 * CRUD operations for the users table.
 */

import type { UserInsert, UserRow, UserUpdate } from '../../types/supabase';
import { supabase } from '../supabase';

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getUserByUsername error:', error.message);
    return null;
  }
  return data;
}

export async function getUserByUid(uid: string): Promise<UserRow | null> {
  const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getUserByUid error:', error.message);
    return null;
  }
  return data;
}

export async function createUser(user: UserInsert): Promise<UserRow | null> {
  const { data, error } = await supabase.from('users').insert(user).select().single();

  if (error) {
    console.error('[DB] createUser error:', error.message);
    return null;
  }
  return data;
}

export async function updateUser(username: string, updates: UserUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('username', username.toLowerCase());

  if (error) {
    console.error('[DB] updateUser error:', error.message);
    return false;
  }
  return true;
}

export async function upsertUser(user: UserInsert): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'username' })
    .select()
    .single();

  if (error) {
    console.error('[DB] upsertUser error:', error.message);
    return null;
  }
  return data;
}

export async function searchUsers(query: string, limit = 20): Promise<UserRow[]> {
  const searchTerm = query.toLowerCase().replace(/^@/, '');
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', `${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('[DB] searchUsers error:', error.message);
    return [];
  }
  return data || [];
}
