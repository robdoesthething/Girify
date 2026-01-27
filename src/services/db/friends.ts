/**
 * Friends Database Operations
 *
 * Friendship and friend request operations.
 */

import type { FriendRequestRow } from '../../types/supabase';
import { createLogger } from '../../utils/logger';
import { supabase } from '../supabase';
import { executeQuery } from './utils';

const logger = createLogger('DB:Friends');

// ============================================================================
// FRIENDSHIPS
// ============================================================================

export async function getFriends(
  username: string
): Promise<Array<{ friend_username: string; since: string }>> {
  const data = await executeQuery<Array<{ friend_username: string; since: string }>>(
    supabase.rpc('get_friends', {
      user_username: username.toLowerCase(),
    }),
    'getFriends'
  );
  return data || [];
}

export async function areFriends(user1: string, user2: string): Promise<boolean> {
  const data = await executeQuery<boolean>(
    supabase.rpc('are_friends', {
      user1: user1.toLowerCase(),
      user2: user2.toLowerCase(),
    }),
    'areFriends'
  );
  return !!data;
}

export async function addFriendship(user1: string, user2: string): Promise<boolean> {
  const data = await executeQuery<boolean>(
    supabase.rpc('add_friendship', {
      user1: user1.toLowerCase(),
      user2: user2.toLowerCase(),
    }),
    'addFriendship'
  );
  return !!data;
}

export async function removeFriendship(user1: string, user2: string): Promise<boolean> {
  const data = await executeQuery<boolean>(
    supabase.rpc('remove_friendship', {
      user1: user1.toLowerCase(),
      user2: user2.toLowerCase(),
    }),
    'removeFriendship'
  );
  return !!data;
}

// ============================================================================
// FRIEND REQUESTS
// ============================================================================

export async function getPendingFriendRequests(username: string): Promise<FriendRequestRow[]> {
  const data = await executeQuery<FriendRequestRow[]>(
    supabase
      .from('friend_requests')
      .select('*')
      .eq('to_user', username.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    'getPendingFriendRequests'
  );
  return data || [];
}

export async function getSentFriendRequests(username: string): Promise<FriendRequestRow[]> {
  const data = await executeQuery<FriendRequestRow[]>(
    supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user', username.toLowerCase())
      .eq('status', 'pending'),
    'getSentFriendRequests'
  );
  return data || [];
}

export async function createFriendRequest(fromUser: string, toUser: string): Promise<boolean> {
  const { error } = await supabase.from('friend_requests').insert({
    from_user: fromUser.toLowerCase(),
    to_user: toUser.toLowerCase(),
    status: 'pending',
  });

  if (error) {
    logger.error('createFriendRequest error:', error.message);
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
    logger.error('updateFriendRequestStatus error:', error.message);
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
    logger.error('deleteFriendRequest error:', error.message);
    return false;
  }
  return true;
}
