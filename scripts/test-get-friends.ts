import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testGetFriends() {
  console.log('\n🔍 Testing get_friends RPC\n');
  console.log('══════════════════════════════════════════════════\n');

  const usernames = ['@robertosnc7344', '@robertosnc9113', 'robertosnc7344', 'robertosnc9113'];

  for (const username of usernames) {
    console.log(`\n📝 Testing username: "${username}"`);
    console.log(`   Normalized: "${username.toLowerCase()}"`);

    const { data, error } = await supabase.rpc('get_friends', {
      user_username: username.toLowerCase(),
    });

    if (error) {
      console.error('   ❌ Error:', error.message);
    } else if (!data || data.length === 0) {
      console.log('   ⚠️  No friends found');
    } else {
      console.log(`   ✅ Found ${data.length} friend(s):`);
      data.forEach((friend: any) => {
        console.log(`      - ${friend.friend_username} (since ${friend.since})`);
      });
    }
  }

  console.log('\n══════════════════════════════════════════════════\n');
}

testGetFriends().catch(console.error);
