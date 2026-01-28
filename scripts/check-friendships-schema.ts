/**
 * Check Friendships Table Schema
 *
 * Verifies the actual database schema matches our expectations
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkSchema() {
  console.log('\n🔍 Checking Friendships Table Schema\n');
  console.log('═'.repeat(50));

  // Try to select from friendships with all possible column names
  console.log('\n1️⃣  Checking friendships table columns...');

  const tests = [
    { columns: 'user_a, user_b', description: 'user_a, user_b (expected from schema)' },
    { columns: 'user1, user2', description: 'user1, user2 (alternative naming)' },
    { columns: '*', description: 'all columns' },
  ];

  for (const test of tests) {
    console.log(`\n   Testing: ${test.description}`);
    const { data, error } = await supabase.from('friendships').select(test.columns).limit(1);

    if (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    } else {
      console.log(`   ✅ Success! Sample row:`);
      if (data && data.length > 0) {
        console.log('      ', JSON.stringify(data[0], null, 2));
      } else {
        console.log('       (no data, but columns exist)');
      }
      break; // Found working column names
    }
  }

  // Try manual insert to test RLS
  console.log('\n2️⃣  Testing direct INSERT into friendships...');
  const { data: insertData, error: insertError } = await supabase
    .from('friendships')
    .insert({
      user_a: '@robertosnc7344',
      user_b: '@robertosnc9113',
    })
    .select();

  if (insertError) {
    console.error('   ❌ Insert failed:', insertError.message);
    console.error('   Error code:', insertError.code);

    if (insertError.code === '42501') {
      console.error('\n   💡 RLS policy is blocking the insert!');
      console.error('   Run: scripts/fix-rls-friendships.sql');
    } else if (insertError.code === '23514') {
      console.error('\n   💡 CHECK constraint violation (user_a must be < user_b)');
      console.error('   Current order: @robertosnc7344 < @robertosnc9113?');
      console.error('   Result:', '@robertosnc7344' < '@robertosnc9113');
    } else if (insertError.code === '23503') {
      console.error("\n   💡 Foreign key violation - username doesn't exist in users table");
    }
  } else {
    console.log('   ✅ Insert successful!');
    console.log('      ', insertData);

    // Clean up
    if (insertData && insertData[0]) {
      await supabase.from('friendships').delete().eq('id', insertData[0].id);
      console.log('   🧹 Cleaned up test data');
    }
  }

  console.log('\n' + '═'.repeat(50));
}

checkSchema().catch(console.error);
