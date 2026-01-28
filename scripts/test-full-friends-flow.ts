import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.development') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Simulate what the frontend does
function sanitizeUsername(username: string): string {
  return username.toLowerCase().replace(/^@/, '').replace(/\//g, '_');
}

async function testFrontendFlow() {
  console.log('\n🔍 Testing Full Frontend Flow\n');
  console.log('══════════════════════════════════════════════════\n');

  // Simulate user logged in with Firebase displayName
  const firebaseDisplayName = '@robertosnc7344';
  console.log(`1️⃣  User logged in with displayName: "${firebaseDisplayName}"\n`);

  // Frontend sanitizes username (removes @)
  const sanitized = sanitizeUsername(firebaseDisplayName);
  console.log(`2️⃣  Frontend sanitizes to: "${sanitized}"\n`);

  // Frontend calls get_friends RPC
  console.log(`3️⃣  Calling get_friends('${sanitized}')...\n`);
  const { data: friends, error } = await supabase.rpc('get_friends', {
    user_username: sanitized,
  });

  if (error) {
    console.error('   ❌ Error:', error.message);
  } else if (!friends || friends.length === 0) {
    console.log('   ❌ No friends found - Frontend would show empty list');
  } else {
    console.log(`   ✅ Found ${friends.length} friend(s):`);
    friends.forEach((friend: any) => {
      console.log(`      - ${friend.friend_username}`);
    });
    console.log('\n   ✅ Frontend would display friends list successfully!');
  }

  console.log('\n══════════════════════════════════════════════════\n');
}

testFrontendFlow().catch(console.error);
