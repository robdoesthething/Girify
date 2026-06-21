/**
 * Check Recent Database Activity
 *
 * Helps diagnose if games/friendships are actually being saved
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkRecentActivity() {
  console.log('\n🔍 Checking Recent Database Activity\n');
  console.log('═'.repeat(50));

  // Check recent games
  console.log('\n1️⃣  Recent Game Results (last 10):');
  const { data: games } = await supabase
    .from('game_results')
    .select('id, user_id, score, played_at')
    .order('played_at', { ascending: false })
    .limit(10);

  if (!games || games.length === 0) {
    console.log('   ⚠️  No game results found');
  } else {
    console.log(`   ✅ Found ${games.length} recent games:`);
    games.forEach(g => {
      const date = new Date(g.played_at).toLocaleString();
      const user = g.user_id || 'anonymous';
      console.log(`      ${date} - ${user} - ${g.score} points`);
    });
  }

  // Check total games
  const { data: totalGames, count: gameCount } = await supabase
    .from('game_results')
    .select('id', { count: 'exact', head: true });

  console.log(`\n   📊 Total games in database: ${gameCount || 0}`);

  // Check friendships
  console.log('\n2️⃣  Friendships:');
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_a, user_b, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!friendships || friendships.length === 0) {
    console.log('   ⚠️  No friendships found');
  } else {
    console.log(`   ✅ Found ${friendships.length} friendships:`);
    friendships.forEach(f => {
      const date = new Date(f.created_at).toLocaleDateString();
      console.log(`      ${f.user_a} ↔ ${f.user_b} (since ${date})`);
    });
  }

  // Check friend requests
  console.log('\n3️⃣  Friend Requests:');
  const { data: requests } = await supabase
    .from('friend_requests')
    .select('from_user, to_user, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!requests || requests.length === 0) {
    console.log('   ⚠️  No friend requests found');
  } else {
    console.log(`   ✅ Found ${requests.length} friend requests:`);
    requests.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString();
      console.log(`      ${r.from_user} → ${r.to_user} [${r.status}] (${date})`);
    });
  }

  // Check users
  console.log('\n4️⃣  Users:');
  const { data: users, count: userCount } = await supabase
    .from('users')
    .select('username, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`   📊 Total users: ${userCount || 0}`);
  if (users && users.length > 0) {
    console.log('   Recent users:');
    users.forEach(u => {
      const date = new Date(u.created_at).toLocaleDateString();
      console.log(`      ${u.username} (joined ${date})`);
    });
  }

  console.log('\n' + '═'.repeat(50));
  console.log('\n💡 Interpretation:\n');

  if (gameCount === 0) {
    console.log('   ⚠️  No games found - this suggests:');
    console.log('      - Users are playing but saves are failing');
    console.log('      - Check browser console for errors');
    console.log('      - Verify Supabase authentication is working');
  } else if (games && games[0]) {
    const lastGame = new Date(games[0].played_at);
    const hoursAgo = Math.round((Date.now() - lastGame.getTime()) / (1000 * 60 * 60));
    console.log(`   ✅ Last game played: ${hoursAgo} hours ago`);
    if (hoursAgo > 24) {
      console.log('      ⚠️  No recent games - app might not be in use');
    }
  }

  if (!friendships || friendships.length === 0) {
    console.log('\n   ⚠️  No friendships - this suggests:');
    console.log("      - Social features haven't been used yet, OR");
    console.log('      - Friend requests are failing');
  }

  console.log('\n');
}

checkRecentActivity().catch(console.error);
