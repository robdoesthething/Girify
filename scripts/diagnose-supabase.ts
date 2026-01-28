/**
 * Supabase Diagnostic Script
 *
 * Run with: npx tsx scripts/diagnose-supabase.ts
 *
 * Tests:
 * 1. Supabase connection
 * 2. Table access (game_results, friendships, friend_requests)
 * 3. RPC function availability
 * 4. RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.development
config({ path: resolve(process.cwd(), '.env.development') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('\n🔍 Supabase Diagnostic Tool\n');
console.log('═'.repeat(50));

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('\n1️⃣  Testing Connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('   ❌ Connection failed:', error.message);
      return false;
    }
    console.log('   ✅ Connection successful');
    return true;
  } catch (err) {
    console.error('   ❌ Connection error:', err);
    return false;
  }
}

async function testGameResultsInsert() {
  console.log('\n2️⃣  Testing game_results INSERT...');
  try {
    // Test with NULL user_id (anonymous game) to avoid foreign key constraint
    const testData = {
      user_id: null,
      score: 1000,
      time_taken: 60,
      correct_answers: 5,
      question_count: 10,
      played_at: new Date().toISOString(),
      platform: 'diagnostic',
      is_bonus: false,
    };

    const { data, error } = await supabase.from('game_results').insert(testData).select();

    if (error) {
      console.error('   ❌ Insert failed:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));

      // Check for specific error types
      if (error.code === '42501') {
        console.error('   💡 This is an RLS policy violation.');
        console.error('   Run: scripts/fix-rls-game-results.sql');
      } else if (error.code === '23503') {
        console.error('   💡 This is a foreign key constraint (expected for test users).');
        console.error('   Testing with NULL user_id instead...');
      }

      return false;
    }

    console.log('   ✅ Insert successful (anonymous game)');

    // Clean up
    if (data && data[0]) {
      await supabase.from('game_results').delete().eq('id', data[0].id);
      console.log('   🧹 Cleaned up test data');
    }

    return true;
  } catch (err) {
    console.error('   ❌ Insert error:', err);
    return false;
  }
}

async function testGameResultsSelect() {
  console.log('\n3️⃣  Testing game_results SELECT...');
  try {
    const { data, error } = await supabase
      .from('game_results')
      .select('id, score')
      .order('played_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('   ❌ Select failed:', error.message);
      return false;
    }

    console.log(`   ✅ Select successful (found ${data?.length || 0} recent games)`);
    return true;
  } catch (err) {
    console.error('   ❌ Select error:', err);
    return false;
  }
}

async function testFriendshipRPC() {
  console.log('\n4️⃣  Testing friendship RPC functions...');

  // Test get_friends
  try {
    const { data, error } = await supabase.rpc('get_friends', {
      user_username: 'test_user',
    });

    if (error) {
      console.error('   ❌ get_friends RPC failed:', error.message);
      console.error('   This likely means the RPC function is not defined in your database');
      console.error('   Run: scripts/supabase-schema.sql in your Supabase SQL editor');
      return false;
    }

    console.log('   ✅ get_friends RPC available');
  } catch (err) {
    console.error('   ❌ RPC error:', err);
    return false;
  }

  // Test are_friends
  try {
    const { data, error } = await supabase.rpc('are_friends', {
      user1: 'test1',
      user2: 'test2',
    });

    if (error) {
      console.error('   ❌ are_friends RPC failed:', error.message);
      return false;
    }

    console.log('   ✅ are_friends RPC available');
    return true;
  } catch (err) {
    console.error('   ❌ RPC error:', err);
    return false;
  }
}

async function testFriendRequestsAccess() {
  console.log('\n5️⃣  Testing friend_requests table access...');
  try {
    const { data, error } = await supabase.from('friend_requests').select('id').limit(1);

    if (error) {
      console.error('   ❌ friend_requests access failed:', error.message);
      return false;
    }

    console.log('   ✅ friend_requests table accessible');
    return true;
  } catch (err) {
    console.error('   ❌ Access error:', err);
    return false;
  }
}

async function runDiagnostics() {
  console.log('Starting diagnostics...\n');

  const results = {
    connection: await testConnection(),
    gameInsert: await testGameResultsInsert(),
    gameSelect: await testGameResultsSelect(),
    friendshipRPC: await testFriendshipRPC(),
    friendRequests: await testFriendRequestsAccess(),
  };

  console.log('\n═'.repeat(50));
  console.log('\n📊 Summary:\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`   Connection:       ${results.connection ? '✅' : '❌'}`);
  console.log(`   Game Insert:      ${results.gameInsert ? '✅' : '❌'}`);
  console.log(`   Game Select:      ${results.gameSelect ? '✅' : '❌'}`);
  console.log(`   Friendship RPC:   ${results.friendshipRPC ? '✅' : '❌'}`);
  console.log(`   Friend Requests:  ${results.friendRequests ? '✅' : '❌'}`);

  console.log(`\n   ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n✅ All diagnostics passed! Supabase is working correctly.');
    console.log("   If you're still experiencing issues, check:");
    console.log('   - Browser console for client-side errors');
    console.log('   - Firebase authentication status');
    console.log('   - Network tab for failed requests');
  } else {
    console.log('\n⚠️  Some tests failed. See errors above for details.');
    console.log('\n💡 Common fixes:');
    console.log('   1. Run: scripts/supabase-schema.sql in Supabase SQL Editor');
    console.log('   2. Run: scripts/fix-supabase-permissions.sql in Supabase SQL Editor');
    console.log('   3. Check RLS policies in Supabase Dashboard > Authentication > Policies');
    console.log('   4. Verify .env.development has correct SUPABASE_URL and ANON_KEY');
  }

  console.log('\n');
}

runDiagnostics().catch(console.error);
