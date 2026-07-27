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
    supabase.from('users').select('*').eq('supabase_uid', uid).single(),
    'getUserByUid'
  );
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const cleanEmail = email.toLowerCase().trim();
  return executeQuery<UserRow>(
    supabase.from('users').select('*').eq('email', cleanEmail).limit(1).single(),
    'getUserByEmail'
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

type FriendProfileData = Pick<
  UserRow,
  'username' | 'equipped_badges' | 'avatar_id' | 'equipped_cosmetics'
>;

export async function getFriendProfilesByUsernames(
  usernames: string[]
): Promise<FriendProfileData[]> {
  if (usernames.length === 0) {
    return [];
  }
  const result = await executeQuery<FriendProfileData[]>(
    supabase
      .from('users')
      .select('username, equipped_badges, avatar_id, equipped_cosmetics')
      .in('username', usernames),
    'getFriendProfilesByUsernames'
  );
  return result || [];
}

type LeaderboardUserData = Pick<UserRow, 'username' | 'district' | 'equipped_cosmetics'>;

export async function getLeaderboardUserData(usernames: string[]): Promise<LeaderboardUserData[]> {
  if (usernames.length === 0) {
    return [];
  }
  const result = await executeQuery<LeaderboardUserData[]>(
    supabase
      .from('users')
      .select('username, district, equipped_cosmetics')
      .in('username', usernames),
    'getLeaderboardUserData'
  );
  return result || [];
}

type UserTeamData = Pick<UserRow, 'username' | 'team' | 'district'>;

export async function getUserTeamData(): Promise<UserTeamData[]> {
  const result = await executeQuery<UserTeamData[]>(
    supabase.from('users').select('username, team, district').not('team', 'is', null),
    'getUserTeamData'
  );
  return result || [];
}

export async function getAllUsers(limit = 50): Promise<UserRow[]> {
  const result = await executeQuery<UserRow[]>(
    supabase.from('users').select('*').limit(limit),
    'getAllUsers'
  );
  return result || [];
}

export async function deleteUserByUsername(username: string): Promise<void> {
  const cleanUsername = normalizeUsername(username);
  const { error } = await supabase.from('users').delete().eq('username', cleanUsername);
  if (error) {
    throw new Error(error.message);
  }
}

export async function countUsers(options?: { since?: string; banned?: boolean }): Promise<number> {
  let query = supabase.from('users').select('*', { count: 'exact', head: true });
  if (options?.since) {
    query = query.gte('joined_at', options.since);
  }
  if (options?.banned) {
    query = query.eq('banned', true);
  }
  const { count, error } = await query;
  if (error) {
    console.error('[DB] countUsers error:', error.message);
    return 0;
  }
  return count || 0;
}

type UserMetricsSample = Pick<UserRow, 'username' | 'joined_at' | 'giuros'>;

export async function getUserMetricsSample(limit = 500): Promise<UserMetricsSample[]> {
  const result = await executeQuery<UserMetricsSample[]>(
    supabase.from('users').select('username, joined_at, giuros').limit(limit),
    'getUserMetricsSample'
  );
  return result || [];
}
