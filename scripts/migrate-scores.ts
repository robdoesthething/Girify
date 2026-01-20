/**
 * Migrate Scores Script
 *
 * Migrates Firestore 'scores' collection to Supabase 'game_results' table
 * Also migrates users/{}/games subcollection to 'user_games' table
 *
 * Usage: npx tsx scripts/migrate-scores.ts <path-to-service-account.json>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Types
interface FirestoreScore {
  username?: string;
  score: number;
  time?: number;
  time_taken?: number;
  date?: number;
  timestamp?: Timestamp | { seconds: number };
  platform?: string;
  isBonus?: boolean;
  correctAnswers?: number | null;
  questionCount?: number;
  streakAtPlay?: number | null;
  email?: string | null;
  uid?: string | null;
}

interface FirestoreUserGame {
  date?: string | number;
  score: number;
  avgTime?: number;
  timestamp?: Timestamp;
  incomplete?: boolean;
  correctAnswers?: number;
  questionCount?: number;
}

interface SupabaseGameResult {
  user_id: string | null;
  score: number;
  time_taken: number;
  played_at: string;
  platform: string;
  correct_answers: number | null;
  question_count: number | null;
  streak_at_play: number | null;
  is_bonus: boolean;
}

interface SupabaseUserGame {
  username: string;
  date: string;
  score: number;
  avg_time: number | null;
  played_at: string;
  incomplete: boolean;
  correct_answers: number | null;
  question_count: number | null;
}

// Helper functions
function timestampToISO(ts: Timestamp | { seconds: number } | undefined | null): string {
  if (!ts) return new Date().toISOString();
  try {
    if ('toDate' in ts && typeof ts.toDate === 'function') {
      return ts.toDate().toISOString();
    }
    if ('seconds' in ts) {
      return new Date(ts.seconds * 1000).toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

function dateNumberToString(date: number | string | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];

  if (typeof date === 'string') {
    // Already a string date
    if (date.includes('-')) return date;
    // Might be YYYYMMDD as string
    const d = parseInt(date, 10);
    if (!isNaN(d)) {
      const year = Math.floor(d / 10000);
      const month = Math.floor((d % 10000) / 100);
      const day = d % 100;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return date;
  }

  // Numeric YYYYMMDD format
  const year = Math.floor(date / 10000);
  const month = Math.floor((date % 10000) / 100);
  const day = date % 100;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function loadEnv(): { supabaseUrl: string; supabaseKey: string } {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, '../.env.development');

  let supabaseUrl = '';
  let supabaseKey = '';
  let serviceRoleKey = '';

  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        const val = values.join('=').trim();
        const trimmedKey = key.trim();
        if (trimmedKey === 'VITE_SUPABASE_URL') supabaseUrl = val;
        if (trimmedKey === 'VITE_SUPABASE_ANON_KEY') supabaseKey = val;
        if (trimmedKey === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val;
      }
    });
  } catch (e) {
    console.error('Failed to read .env.development');
    process.exit(1);
  }

  if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
    console.error('Missing Supabase credentials in .env.development');
    process.exit(1);
  }

  // Prefer Service Role Key for migration to bypass RLS
  if (serviceRoleKey) {
    console.log('🔑 Using Service Role Key (Bypassing RLS)');
    return { supabaseUrl, supabaseKey: serviceRoleKey };
  } else {
    console.warn('⚠️  Using Anon Key (Subject to RLS) - Migrations may fail!');
    console.warn('👉 Add SUPABASE_SERVICE_ROLE_KEY to .env.development to fix this.');
  }

  return { supabaseUrl, supabaseKey };
}

// Transform functions
function transformScore(data: FirestoreScore): SupabaseGameResult {
  let username = data.username?.toLowerCase() || null;
  if (username && !username.startsWith('@')) {
    username = `@${username}`;
  }

  const time = data.time ?? data.time_taken ?? 0;

  return {
    user_id: username,
    score: data.score || 0,
    time_taken: time,
    played_at: timestampToISO(data.timestamp),
    platform: data.platform || 'web',
    correct_answers: data.correctAnswers ?? null,
    question_count: data.questionCount ?? null,
    streak_at_play: data.streakAtPlay ?? null,
    is_bonus: data.isBonus || false,
  };
}

function transformUserGame(username: string, data: FirestoreUserGame): SupabaseUserGame {
  const dateStr =
    typeof data.date === 'number'
      ? dateNumberToString(data.date)
      : typeof data.date === 'string'
        ? data.date
        : new Date().toISOString().split('T')[0];

  return {
    username: username.toLowerCase(),
    date: dateStr,
    score: data.score || 0,
    avg_time: data.avgTime ?? null,
    played_at: data.timestamp ? timestampToISO(data.timestamp) : new Date().toISOString(),
    incomplete: data.incomplete || false,
    correct_answers: data.correctAnswers ?? null,
    question_count: data.questionCount ?? null,
  };
}

// Migration functions
async function migrateScores(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Global Scores to game_results ---');

  const scoresRef = firestore.collection('scores');
  const snapshot = await scoresRef.get();

  console.log(`Found ${snapshot.size} score documents.`);

  if (snapshot.empty) {
    console.log('No scores to migrate.');
    return;
  }

  const scores: SupabaseGameResult[] = [];
  const seenKeys = new Set<string>();

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreScore;
    const score = transformScore(data);

    // Create a deduplication key
    const key = `${score.user_id}-${score.played_at}-${score.score}`;
    if (seenKeys.has(key)) {
      continue; // Skip duplicate
    }
    seenKeys.add(key);

    scores.push(score);
  }

  console.log(`After deduplication: ${scores.length} scores to insert.`);

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < scores.length; i += BATCH_SIZE) {
    const batch = scores.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('game_results').insert(batch);

    if (error) {
      console.error(`Error inserting scores batch ${i / BATCH_SIZE + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log(`Inserted scores: ${insertedCount}/${scores.length}`);
    }
  }

  console.log(`✅ Scores migration complete: ${insertedCount} inserted, ${errorCount} errors`);
}

async function migrateUserGames(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating User Games History ---');

  const usersRef = firestore.collection('users');
  const usersSnapshot = await usersRef.get();

  console.log(`Scanning ${usersSnapshot.size} users for game history...`);

  const userGames: SupabaseUserGame[] = [];
  let usersWithGames = 0;

  for (const userDoc of usersSnapshot.docs) {
    const username = userDoc.id;

    try {
      const gamesSnapshot = await userDoc.ref.collection('games').get();

      if (!gamesSnapshot.empty) {
        usersWithGames++;

        for (const gameDoc of gamesSnapshot.docs) {
          const data = gameDoc.data() as FirestoreUserGame;
          userGames.push(transformUserGame(username, data));
        }
      }
    } catch (e) {
      // Subcollection doesn't exist, skip
    }
  }

  console.log(`Found ${userGames.length} game history records from ${usersWithGames} users.`);

  if (userGames.length === 0) {
    console.log('No user games to migrate.');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < userGames.length; i += BATCH_SIZE) {
    const batch = userGames.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('user_games').insert(batch);

    if (error) {
      console.error(`Error inserting user games batch:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log(`Inserted user games: ${insertedCount}/${userGames.length}`);
    }
  }

  console.log(`✅ User games migration complete: ${insertedCount} inserted, ${errorCount} errors`);
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/migrate-scores.ts <path-to-service-account.json>');
    process.exit(1);
  }

  const serviceAccountPath = path.resolve(process.cwd(), args[0]);

  // Initialize Firebase Admin
  let app: App;
  try {
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin initialized');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }

  const firestore = getFirestore(app);

  // Initialize Supabase
  const { supabaseUrl, supabaseKey } = loadEnv();
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('📦 Supabase client initialized');

  // Run migrations
  try {
    await migrateScores(firestore, supabase);
    await migrateUserGames(firestore, supabase);

    console.log('\n✅ All score migrations complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
