import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import path from 'path';
import readline from 'readline';

/**
 * Publish News Script (Supabase)
 *
 * Usage: node scripts/publishNewsSupabase.js
 *
 * Reads Supabase credentials from .env or .env.development
 */

const loadEnv = async () => {
  const envFiles = ['.env', '.env.development', '.env.local'];
  const vars = {};

  for (const file of envFiles) {
    try {
      const content = await readFile(path.resolve(process.cwd(), file), 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          vars[match[1].trim()] = match[2].trim();
        }
      }
    } catch {
      // File not found, skip
    }
  }

  return vars;
};

const run = async () => {
  const env = await loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env files');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Connected to Supabase');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = query => new Promise(resolve => rl.question(query, resolve));

  console.log('\n--- Publish New Announcement (Supabase) ---\n');

  const title = await question('Title: ');
  const body = await question('Body (use \\n for newlines): ');
  const priority = (await question('Priority (normal/high/urgent) [normal]: ')) || 'normal';
  const confirm = await question(`\nPublish "${title}"? (y/N): `);

  if (confirm.toLowerCase() === 'y') {
    const now = new Date().toISOString();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        body: body.replace(/\\n/g, '\n'),
        priority,
        target_audience: 'all',
        publish_date: now,
        expiry_date: expiry.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error publishing:', error.message);
    } else {
      console.log(`Announcement published! ID: ${data.id}`);
    }
  } else {
    console.log('Cancelled.');
  }

  rl.close();
};

run();
