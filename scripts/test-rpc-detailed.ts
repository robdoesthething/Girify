import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testRPC() {
  console.log('\n🔍 Testing RPC Function Detailed\n');
  console.log('══════════════════════════════════════════════════\n');

  // First, check if friendship already exists
  console.log('1️⃣  Checking existing friendship...');
  const { data: existing, error: existError } = await supabase
    .from('friendships')
    .select('*')
    .or(
      'and(user_a.eq.@robertosnc9113,user_b.eq.@robertosnc7344),and(user_a.eq.@robertosnc7344,user_b.eq.@robertosnc9113)'
    );

  if (existError) {
    console.error('   ❌ Error checking:', existError.message);
  } else {
    console.log(`   Found ${existing?.length || 0} existing friendships`);
    if (existing && existing.length > 0) {
      console.log('   Details:', existing);
    }
  }

  // Test the RPC call
  console.log('\n2️⃣  Calling add_friendship RPC...');
  console.log('   Parameters: user1=@robertosnc9113, user2=@robertosnc7344');
  const { data: rpcData, error: rpcError } = await supabase.rpc('add_friendship', {
    user1: '@robertosnc9113',
    user2: '@robertosnc7344',
  });

  if (rpcError) {
    console.error('   ❌ RPC Error:', rpcError.message);
    console.error('   Error code:', rpcError.code);
    console.error('   Error details:', rpcError.details);
  } else {
    console.log('   ✅ RPC returned:', rpcData);
  }

  // Check again after RPC
  console.log('\n3️⃣  Checking friendship after RPC...');
  const { data: after, error: afterError } = await supabase
    .from('friendships')
    .select('*')
    .or(
      'and(user_a.eq.@robertosnc9113,user_b.eq.@robertosnc7344),and(user_a.eq.@robertosnc7344,user_b.eq.@robertosnc9113)'
    );

  if (afterError) {
    console.error('   ❌ Error:', afterError.message);
  } else {
    console.log(`   Found ${after?.length || 0} friendships`);
    if (after && after.length > 0) {
      console.log('   Details:', after);
    } else {
      console.log('   ⚠️  No friendship found - RPC did not create it');
    }
  }

  // Try direct insert with anon key
  console.log('\n4️⃣  Trying direct INSERT...');
  const { data: insertData, error: insertError } = await supabase
    .from('friendships')
    .insert({
      user_a: '@robertosnc7344',
      user_b: '@robertosnc9113',
    })
    .select();

  if (insertError) {
    console.error('   ❌ Insert error:', insertError.message);
    console.error('   Error code:', insertError.code);
    if (insertError.code === '42501') {
      console.log('   💡 RLS policy is blocking the insert');
    }
  } else {
    console.log('   ✅ Insert successful:', insertData);
  }

  console.log('\n══════════════════════════════════════════════════\n');
}

testRPC().catch(console.error);
