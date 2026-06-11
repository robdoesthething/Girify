/**
 * Publish an announcement to the Supabase `announcements` table.
 *
 * Usage:
 *   node scripts/publishNews.js
 *
 * Requires in environment (or .env.development):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (service-role, NOT anon key)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import readline from 'readline';

config({ path: '.env.development' });
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing env vars. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.development'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = query => new Promise(resolve => rl.question(query, resolve));

const run = async () => {
  console.log('\n--- Publish New Announcement ---\n');

  const title = await ask('Title: ');
  const body = await ask('Body (use \\n for line breaks): ');
  const priority = (await ask('Priority (low/normal/high/urgent) [normal]: ')) || 'normal';
  const daysRaw = await ask('Active for how many days? [7]: ');
  const days = parseInt(daysRaw, 10) || 7;

  const now = new Date().toISOString();
  const expiry = new Date(Date.now() + days * 86_400_000).toISOString();

  const confirm = await ask(
    `\nPublish "${title}" (active for ${days} days, priority: ${priority})? (y/N): `
  );

  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  const { error } = await supabase.from('announcements').insert({
    title,
    body: body.replace(/\\n/g, '\n'),
    priority,
    target_audience: 'all',
    is_active: true,
    publish_date: now,
    expiry_date: expiry,
  });

  if (error) {
    console.error('Failed to publish:', error.message);
    process.exit(1);
  }

  console.log('Announcement published!');
  rl.close();
};

run();
