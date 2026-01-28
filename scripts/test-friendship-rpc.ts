/**
 * Test Friendship RPC Functions with Real Data
 *
 * Tests the actual pending friend request
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testFriendshipRPC() {
  console.log('\n🔍 Testing Friendship RPC with Real Users\n');
  console.log('═'.repeat(50));

  // Get the pending friend request
  console.log('\n1️⃣  Getting pending friend request...');
  const { data: requests } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('status', 'pending')
    .limit(1);

  if (!requests || requests.length === 0) {
    console.log('   ⚠️  No pending friend requests found');
    return;
  }

  const request = requests[0];
  console.log(`   ✅ Found request: ${request.from_user} → ${request.to_user}`);

  // Test add_friendship RPC
  console.log('\n2️⃣  Testing add_friendship RPC...');
  console.log(`   Calling: add_friendship('${request.from_user}', '${request.to_user}')`);

  const { data: addResult, error: addError } = await supabase.rpc('add_friendship', {
    user1: request.from_user,
    user2: request.to_user,
  });

  if (addError) {
    console.error('   ❌ RPC failed:', addError.message);
    console.error('   Error code:', addError.code);
    console.error('   Error details:', JSON.stringify(addError, null, 2));

    if (addError.code === '42883') {
      console.error('\n   💡 Function does not exist in database!');
      console.error('   Run: scripts/supabase-schema.sql');
    } else if (addError.code === '23505') {
      console.error('\n   💡 Friendship already exists (duplicate key)');
    }

    return;
  }

  console.log('   ✅ RPC call successful');
  console.log('   Result:', addResult);

  // Verify friendship was created
  console.log('\n3️⃣  Verifying friendship was created...');
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(user1.eq.${request.from_user},user2.eq.${request.to_user}),` +
        `and(user1.eq.${request.to_user},user2.eq.${request.from_user})`
    );

  if (!friendships || friendships.length === 0) {
    console.error('   ❌ Friendship NOT found in database!');
    console.error('   This means the RPC function did not create the friendship.');
    return;
  }

  console.log('   ✅ Friendship exists in database:');
  console.log('      ', friendships[0]);

  // Test are_friends RPC
  console.log('\n4️⃣  Testing are_friends RPC...');
  const { data: areFriendsResult, error: areFriendsError } = await supabase.rpc('are_friends', {
    user1: request.from_user,
    user2: request.to_user,
  });

  if (areFriendsError) {
    console.error('   ❌ are_friends RPC failed:', areFriendsError.message);
    return;
  }

  console.log('   ✅ are_friends returned:', areFriendsResult);

  console.log('\n' + '═'.repeat(50));
  console.log('\n✅ All friendship RPC tests passed!\n');
  console.log('If friendships are still not working in the app, check:');
  console.log('  - Browser console for client-side errors');
  console.log('  - Network tab for failed API requests');
  console.log('  - User is properly authenticated with Firebase\n');
}

testFriendshipRPC().catch(console.error);
