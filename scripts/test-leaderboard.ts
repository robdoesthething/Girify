import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testLeaderboard() {
  console.log('\n🔍 Testing Leaderboard Queries\n');
  console.log('══════════════════════════════════════════════════\n');

  const periods = [
    { name: 'All Time', filter: null },
    { name: 'Daily', filter: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { name: 'Weekly', filter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  for (const period of periods) {
    console.log(`\n📊 ${period.name} Leaderboard:`);

    let query = supabase
      .from('game_results')
      .select('user_id, score, played_at')
      .order('score', { ascending: false })
      .limit(5);

    if (period.filter) {
      query = query.gte('played_at', period.filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`   ⚠️  No games found for this period`);
    } else {
      console.log(`   ✅ Found ${data.length} game(s):`);
      data.forEach((game: any, idx: number) => {
        const username = game.user_id || 'anonymous';
        const date = new Date(game.played_at).toLocaleDateString();
        console.log(`      ${idx + 1}. ${username} - ${game.score} points (${date})`);
      });
    }
  }

  console.log('\n══════════════════════════════════════════════════\n');
}

testLeaderboard().catch(console.error);
