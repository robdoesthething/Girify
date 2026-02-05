/**
 * Database Diagnostics Utility
 *
 * Run this in browser console to diagnose activity feed and profile issues
 * Usage: import and call checkDatabaseHealth(username)
 */

/* eslint-disable no-console */

import { supabase } from '../../services/supabase';
import { normalizeUsername } from '../format';

export interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  data?: unknown;
}

/**
 * Check if user exists in database
 */
async function checkUserExists(username: string): Promise<DiagnosticResult> {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabase
    .from('users')
    .select('username, uid, games_played')
    .eq('username', normalized)
    .single();

  if (error) {
    return {
      check: 'User Profile',
      status: 'fail',
      message: `User not found: ${error.message}`,
    };
  }

  return {
    check: 'User Profile',
    status: 'pass',
    message: `User found: ${data.username} (UID: ${data.uid}, Games: ${data.games_played})`,
    data,
  };
}

/**
 * Check game results exist for user
 */
async function checkGameResults(username: string): Promise<DiagnosticResult> {
  const normalized = normalizeUsername(username);
  const { data, error, count } = await supabase
    .from('game_results')
    .select('*', { count: 'exact' })
    .eq('user_id', normalized)
    .order('played_at', { ascending: false })
    .limit(5);

  if (error) {
    return {
      check: 'Game Results',
      status: 'fail',
      message: `Error fetching game results: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      check: 'Game Results',
      status: 'warning',
      message: 'No game results found. Play a game to populate activity.',
    };
  }

  return {
    check: 'Game Results',
    status: 'pass',
    message: `Found ${count} game results. Latest: Score ${data[0]?.score} at ${data[0]?.played_at}`,
    data,
  };
}

/**
 * Check activity feed entries for user
 */
async function checkActivityFeed(username: string): Promise<DiagnosticResult> {
  const normalized = normalizeUsername(username);
  const { data, error, count } = await supabase
    .from('activity_feed')
    .select('*', { count: 'exact' })
    .eq('username', normalized)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    return {
      check: 'Activity Feed',
      status: 'fail',
      message: `Error fetching activity feed: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      check: 'Activity Feed',
      status: 'warning',
      message:
        'No activity feed entries found. This is the issue! Games should publish activities.',
    };
  }

  return {
    check: 'Activity Feed',
    status: 'pass',
    message: `Found ${count} activity entries. Latest: ${data[0]?.type} at ${data[0]?.created_at}`,
    data,
  };
}

/**
 * Check friends list
 */
async function checkFriends(username: string): Promise<DiagnosticResult> {
  const normalized = normalizeUsername(username);

  // Query both directions of friendships
  const { data: friendsA, error: errorA } = await supabase
    .from('friendships')
    .select('user_b')
    .eq('user_a', normalized);

  const { data: friendsB, error: errorB } = await supabase
    .from('friendships')
    .select('user_a')
    .eq('user_b', normalized);

  if (errorA || errorB) {
    return {
      check: 'Friends',
      status: 'fail',
      message: `Error fetching friends: ${errorA?.message || errorB?.message}`,
    };
  }

  const friendsList = [
    ...(friendsA?.map(f => f.user_b) || []),
    ...(friendsB?.map(f => f.user_a) || []),
  ];

  if (friendsList.length === 0) {
    return {
      check: 'Friends',
      status: 'warning',
      message: 'No friends found. Add friends to populate friends feed.',
    };
  }

  return {
    check: 'Friends',
    status: 'pass',
    message: `Found ${friendsList.length} friends: ${friendsList.join(', ')}`,
    data: friendsList,
  };
}

/**
 * Check friends' activity feed
 */
async function checkFriendsFeed(username: string): Promise<DiagnosticResult> {
  // First get friends
  const friendsResult = await checkFriends(username);

  if (friendsResult.status === 'warning') {
    return {
      check: 'Friends Feed',
      status: 'warning',
      message: 'No friends to check feed for.',
    };
  }

  const friendsList = friendsResult.data as string[];

  const { data, error, count } = await supabase
    .from('activity_feed')
    .select('*', { count: 'exact' })
    .in('username', friendsList)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return {
      check: 'Friends Feed',
      status: 'fail',
      message: `Error fetching friends feed: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      check: 'Friends Feed',
      status: 'warning',
      message: `No activity from ${friendsList.length} friends. They need to play games after the fix.`,
    };
  }

  return {
    check: 'Friends Feed',
    status: 'pass',
    message: `Found ${count} friend activities. Latest: ${data[0]?.username} - ${data[0]?.type}`,
    data,
  };
}

/**
 * Check RLS policies
 */
async function checkRLSPolicies(): Promise<DiagnosticResult> {
  // Try to read from tables that need RLS
  const tables = ['users', 'game_results', 'activity_feed', 'friendships'];
  const results: string[] = [];

  for (const table of tables) {
    const { error } = await (supabase as any).from(table).select('*').limit(1);

    if (error) {
      results.push(`❌ ${table}: ${error.message}`);
    } else {
      results.push(`✅ ${table}: OK`);
    }
  }

  const hasErrors = results.some(r => r.includes('❌'));

  return {
    check: 'RLS Policies',
    status: hasErrors ? 'fail' : 'pass',
    message: results.join('\n'),
  };
}

/**
 * Main diagnostic function
 */
export async function checkDatabaseHealth(username: string): Promise<void> {
  console.log('🔍 Running Database Diagnostics...\n');
  console.log(`Username: ${username}\n`);
  console.log('━'.repeat(60));

  const checks = [
    await checkRLSPolicies(),
    await checkUserExists(username),
    await checkGameResults(username),
    await checkActivityFeed(username),
    await checkFriends(username),
    await checkFriendsFeed(username),
  ];

  // Display results
  checks.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log('   Data:', result.data);
    }
    console.log('');
  });

  console.log('━'.repeat(60));

  // Summary
  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;

  console.log(`\n📊 Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings\n`);

  if (failCount > 0) {
    console.log('🚨 Critical Issues Detected!');
    console.log('Run scripts/fix-supabase-permissions.sql in Supabase SQL Editor');
  } else if (warnCount > 0) {
    console.log('⚠️  Warnings Found:');
    checks.filter(c => c.status === 'warning').forEach(c => console.log(`   - ${c.message}`));
  } else {
    console.log('✨ All checks passed! Database is healthy.');
  }
}

// Make it available in console
if (typeof window !== 'undefined') {
  (window as any).checkDatabaseHealth = checkDatabaseHealth;
}
