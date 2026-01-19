import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.development manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.development');

console.log('Testing Supabase Connection...');

let supabaseUrl = '';
let supabaseKey = '';

try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      const val = values.join('=').trim();
      if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = val;
    }
  });
} catch (e) {
  console.error('Failed to read .env.development:', e.message);
  process.exit(1);
}

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Found (' + supabaseKey.substring(0, 15) + '...)' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials in .env.development');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Attempting to fetch from "game_results"...');
    const { error } = await supabase
      .from('game_results')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection Failed:', error.message);
      console.log('Full Error Details:', JSON.stringify(error, null, 2));

      if (
        error.code === 'PGRST301' ||
        error.message.includes('JWT') ||
        error.code === '401' ||
        error.code === '403'
      ) {
        console.log('\n💡 DIAGNOSIS: The key provided appears to be invalid or unauthorized.');
        console.log('   Supabase Anon Keys typically start with "ey..." (JWT format).');
        console.log('   The key provided starts with: "' + supabaseKey.substring(0, 15) + '"');
      }
    } else {
      console.log('✅ Connection Successful! Supabase appears reachable.');
    }
  } catch (err) {
    console.error('❌ Unexpected Error:', err);
  }
}

testConnection();
