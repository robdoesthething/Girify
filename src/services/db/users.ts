/**
 * User Database Operations
 *
 * CRUD operations for the users table.
 */

import type { UserInsert, UserRow, UserUpdate } from '../../types/supabase';
import { normalizeUsername } from '../../utils/format';
import { supabase } from '../supabase';
import { executeQuery } from './utils';

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const cleanUsername = normalizeUsername(username);
  return executeQuery<UserRow>(
    supabase.from('users').select('*').eq('username', cleanUsername).single(),
    'getUserByUsername'
  );
}

export async function getUserByUid(uid: string): Promise<UserRow | null> {
  return executeQuery<UserRow>(
    supabase.from('users').select('*').eq('uid', uid).single(),
    'getUserByUid'
  );
}

export async function createUser(user: UserInsert): Promise<UserRow | null> {
  return executeQuery<UserRow>(supabase.from('users').insert(user).select().single(), 'createUser');
}

export async function updateUser(username: string, updates: UserUpdate): Promise<boolean> {
  const cleanUsername = normalizeUsername(username);
  // We can't use executeQuery easily for boolean checks without changing its signature,
  // so let's use the explicit error check pattern here for clarity and correctness.
  // Or usage of executeQuery returns null on error.

  const { error } = await supabase.from('users').update(updates).eq('username', cleanUsername);

  if (error) {
    console.error('[DB] updateUser error:', error.message);
    return false;
  }
  return true;
}

export async function upsertUser(user: UserInsert): Promise<UserRow | null> {
  return executeQuery<UserRow>(
    supabase.from('users').upsert(user, { onConflict: 'username' }).select().single(),
    'upsertUser'
  );
}

type UserShopData = Pick<
  UserRow,
  | 'username'
  | 'giuros'
  | 'purchased_cosmetics'
  | 'equipped_cosmetics'
  | 'streak'
  | 'games_played'
  | 'best_score'
>;

export async function getUserShopData(username: string): Promise<UserShopData | null> {
  const cleanUsername = normalizeUsername(username);
  return executeQuery<UserShopData>(
    supabase
      .from('users')
      .select(
        'username, giuros, purchased_cosmetics, equipped_cosmetics, streak, games_played, best_score'
      )
      .eq('username', cleanUsername)
      .single(),
    'getUserShopData'
  );
}

type UserSearchData = Pick<UserRow, 'username' | 'best_score'>;

export async function searchUsers(query: string, limit = 20): Promise<UserSearchData[]> {
  const searchTerm = query.toLowerCase().replace(/^@/, '');
  if (searchTerm.length < 2) {
    return [];
  }
  const result = await executeQuery<UserSearchData[]>(
    supabase
      .from('users')
      .select('username, best_score')
      .ilike('username', `${searchTerm}%`)
      .limit(limit),
    'searchUsers'
  );
  return result || [];
}
