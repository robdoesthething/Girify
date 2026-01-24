/**
 * Friends Database Operations
 *
 * Friendship and friend request operations.
 */

import type { FriendRequestRow } from '../../types/supabase';
import { supabase } from '../supabase';

// ============================================================================
// FRIENDSHIPS
// ============================================================================

export async function getFriends(
  username: string
): Promise<Array<{ friend_username: string; since: string }>> {
  const { data, error } = await supabase.rpc('get_friends', {
    user_username: username.toLowerCase(),
  });

  if (error) {
    console.error('[DB] getFriends error:', error.message);
    return [];
  }
  return data || [];
}

export async function areFriends(user1: string, user2: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('are_friends', {
    user1: user1.toLowerCase(),
    user2: user2.toLowerCase(),
  });

  if (error) {
    console.error('[DB] areFriends error:', error.message);
    return false;
  }
  return data || false;
}

export async function addFriendship(user1: string, user2: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('add_friendship', {
    user1: user1.toLowerCase(),
    user2: user2.toLowerCase(),
  });

  if (error) {
    console.error('[DB] addFriendship error:', error.message);
    return false;
  }
  return data || false;
}

export async function removeFriendship(user1: string, user2: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('remove_friendship', {
    user1: user1.toLowerCase(),
    user2: user2.toLowerCase(),
  });

  if (error) {
    console.error('[DB] removeFriendship error:', error.message);
    return false;
  }
  return data || false;
}

// ============================================================================
// FRIEND REQUESTS
// ============================================================================

export async function getPendingFriendRequests(username: string): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('to_user', username.toLowerCase())
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] getPendingFriendRequests error:', error.message);
    return [];
  }
  return data || [];
}

export async function getSentFriendRequests(username: string): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('from_user', username.toLowerCase())
    .eq('status', 'pending');

  if (error) {
    console.error('[DB] getSentFriendRequests error:', error.message);
    return [];
  }
  return data || [];
}

export async function createFriendRequest(fromUser: string, toUser: string): Promise<boolean> {
  const { error } = await supabase.from('friend_requests').insert({
    from_user: fromUser.toLowerCase(),
    to_user: toUser.toLowerCase(),
    status: 'pending',
  });

  if (error) {
    console.error('[DB] createFriendRequest error:', error.message);
    return false;
  }
  return true;
}

export async function updateFriendRequestStatus(
  fromUser: string,
  toUser: string,
  status: 'accepted' | 'rejected'
): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status })
    .eq('from_user', fromUser.toLowerCase())
    .eq('to_user', toUser.toLowerCase());

  if (error) {
    console.error('[DB] updateFriendRequestStatus error:', error.message);
    return false;
  }
  return true;
}

export async function deleteFriendRequest(fromUser: string, toUser: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('from_user', fromUser.toLowerCase())
    .eq('to_user', toUser.toLowerCase());

  if (error) {
    console.error('[DB] deleteFriendRequest error:', error.message);
    return false;
  }
  return true;
}
