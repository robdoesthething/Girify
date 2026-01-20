/**
 * Migrate Users Script
 *
 * Migrates Firestore 'users' collection and subcollections to Supabase:
 * - users → users table
 * - users/{}/badgeStats → badge_stats table
 * - users/{}/purchasedBadges → purchased_badges table
 *
 * Usage: npx tsx scripts/migrate-users.ts <path-to-service-account.json>
 */

import { cert, initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Types
interface FirestoreUser {
  username: string;
  uid?: string | null;
  email?: string | null;
  realName?: string;
  avatarId?: number;
  joinedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  friendCount?: number;
  gamesPlayed?: number;
  bestScore?: number;
  totalScore?: number;
  referralCode?: string;
  streak?: number;
  maxStreak?: number;
  lastPlayDate?: string | null;
  lastLoginDate?: string | null;
  giuros?: number;
  purchasedCosmetics?: string[];
  equippedCosmetics?: Record<string, string>;
  equippedBadges?: string[];
  language?: string;
  theme?: string;
  notificationSettings?: Record<string, boolean>;
  migratedTo?: string | null;
  migratedFrom?: string | null;
  referredBy?: string | null;
  district?: string;
  team?: string;
  banned?: boolean;
}

interface FirestoreBadgeStats {
  gamesPlayed?: number;
  bestScore?: number;
  streak?: number;
  wrongStreak?: number;
  totalPanKm?: number;
  consecutiveDays?: number;
  gamesWithoutQuitting?: number;
  eixampleCorners?: number;
  gothicStreak?: number;
  bornGuesses?: number;
  poblenouGuesses?: number;
  nightPlay?: boolean;
  ramblasQuickGuess?: boolean;
  precisionGuess?: boolean;
  foodStreetsPerfect?: number;
  fastLoss?: boolean;
  speedModeHighScore?: boolean;
  inviteCount?: number;
  lastPlayDate?: string | null;
}

interface SupabaseUser {
  username: string;
  uid: string | null;
  email: string | null;
  real_name: string | null;
  avatar_id: number;
  joined_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  friend_count: number;
  games_played: number;
  best_score: number;
  total_score: number;
  referral_code: string | null;
  streak: number;
  max_streak: number;
  last_play_date: string | null;
  last_login_date: string | null;
  giuros: number;
  purchased_cosmetics: string[];
  equipped_cosmetics: Record<string, string>;
  equipped_badges: string[];
  language: string;
  theme: string;
  notification_settings: Record<string, boolean>;
  migrated_to: string | null;
  migrated_from: string | null;
  referred_by: string | null;
  district: string | null;
  team: string | null;
  banned: boolean;
}

interface SupabaseBadgeStats {
  username: string;
  games_played: number;
  best_score: number;
  streak: number;
  wrong_streak: number;
  total_pan_km: number;
  consecutive_days: number;
  games_without_quitting: number;
  eixample_corners: number;
  gothic_streak: number;
  born_guesses: number;
  poblenou_guesses: number;
  night_play: boolean;
  ramblas_quick_guess: boolean;
  precision_guess: boolean;
  food_streets_perfect: number;
  fast_loss: boolean;
  speed_mode_high_score: boolean;
  invite_count: number;
  last_play_date: string | null;
}

interface SupabasePurchasedBadge {
  username: string;
  badge_id: string;
  purchased_at: string;
}

// Helper functions
function timestampToISO(ts: Timestamp | undefined | null): string | null {
  if (!ts) return null;
  try {
    return ts.toDate().toISOString();
  } catch {
    return null;
  }
}

function loadEnv(): { supabaseUrl: string; supabaseKey: string } {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, '../.env.development');

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
    console.error('Failed to read .env.development');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.development');
    process.exit(1);
  }

  return { supabaseUrl, supabaseKey };
}

// Transform functions
function transformUser(docId: string, data: FirestoreUser): SupabaseUser {
  return {
    username: data.username || docId,
    uid: data.uid || null,
    email: data.email?.toLowerCase() || null,
    real_name: data.realName || null,
    avatar_id: data.avatarId || 1,
    joined_at: timestampToISO(data.joinedAt),
    created_at: timestampToISO(data.createdAt),
    updated_at: timestampToISO(data.updatedAt),
    friend_count: data.friendCount || 0,
    games_played: data.gamesPlayed || 0,
    best_score: data.bestScore || 0,
    total_score: data.totalScore || 0,
    referral_code: data.referralCode || null,
    streak: data.streak || 0,
    max_streak: data.maxStreak || 0,
    last_play_date: data.lastPlayDate || null,
    last_login_date: data.lastLoginDate || null,
    giuros: data.giuros ?? 10,
    purchased_cosmetics: data.purchasedCosmetics || [],
    equipped_cosmetics: data.equippedCosmetics || {},
    equipped_badges: data.equippedBadges || [],
    language: data.language || 'en',
    theme: data.theme || 'dark',
    notification_settings: data.notificationSettings || {
      dailyReminder: true,
      friendActivity: true,
      newsUpdates: true,
    },
    migrated_to: data.migratedTo || null,
    migrated_from: data.migratedFrom || null,
    referred_by: data.referredBy || null,
    district: data.district || null,
    team: data.team || null,
    banned: data.banned || false,
  };
}

function transformBadgeStats(username: string, data: FirestoreBadgeStats): SupabaseBadgeStats {
  return {
    username,
    games_played: data.gamesPlayed || 0,
    best_score: data.bestScore || 0,
    streak: data.streak || 0,
    wrong_streak: data.wrongStreak || 0,
    total_pan_km: data.totalPanKm || 0,
    consecutive_days: data.consecutiveDays || 0,
    games_without_quitting: data.gamesWithoutQuitting || 0,
    eixample_corners: data.eixampleCorners || 0,
    gothic_streak: data.gothicStreak || 0,
    born_guesses: data.bornGuesses || 0,
    poblenou_guesses: data.poblenouGuesses || 0,
    night_play: data.nightPlay || false,
    ramblas_quick_guess: data.ramblasQuickGuess || false,
    precision_guess: data.precisionGuess || false,
    food_streets_perfect: data.foodStreetsPerfect || 0,
    fast_loss: data.fastLoss || false,
    speed_mode_high_score: data.speedModeHighScore || false,
    invite_count: data.inviteCount || 0,
    last_play_date: data.lastPlayDate || null,
  };
}

// Migration functions
async function migrateUsers(
  firestore: Firestore,
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  console.log('\n--- Migrating Users ---');

  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.get();

  console.log(`Found ${snapshot.size} user documents.`);

  const users: SupabaseUser[] = [];
  const usernameMap = new Map<string, string>(); // docId -> username

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreUser;
    const user = transformUser(doc.id, data);
    users.push(user);
    usernameMap.set(doc.id, user.username);
  }

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('users').upsert(batch, {
      onConflict: 'username',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Error inserting users batch ${i / BATCH_SIZE + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log(`Inserted users: ${insertedCount}/${users.length}`);
    }
  }

  console.log(`✅ Users migration complete: ${insertedCount} inserted, ${errorCount} errors`);
  return usernameMap;
}

async function migrateBadgeStats(
  firestore: Firestore,
  supabase: SupabaseClient,
  usernameMap: Map<string, string>
): Promise<void> {
  console.log('\n--- Migrating Badge Stats ---');

  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.get();

  const badgeStats: SupabaseBadgeStats[] = [];

  for (const userDoc of snapshot.docs) {
    const username = usernameMap.get(userDoc.id) || userDoc.id;

    try {
      const badgeStatsDoc = await userDoc.ref.collection('badgeStats').doc('current').get();

      if (badgeStatsDoc.exists) {
        const data = badgeStatsDoc.data() as FirestoreBadgeStats;
        badgeStats.push(transformBadgeStats(username, data));
      }
    } catch (e) {
      // Subcollection doesn't exist, skip
    }
  }

  console.log(`Found ${badgeStats.length} badge stats documents.`);

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < badgeStats.length; i += BATCH_SIZE) {
    const batch = badgeStats.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('badge_stats').upsert(batch, {
      onConflict: 'username',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Error inserting badge stats batch:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted badge stats: ${insertedCount}/${badgeStats.length}`);
    }
  }

  console.log(`✅ Badge stats migration complete: ${insertedCount} inserted`);
}

async function migratePurchasedBadges(
  firestore: Firestore,
  supabase: SupabaseClient,
  usernameMap: Map<string, string>
): Promise<void> {
  console.log('\n--- Migrating Purchased Badges ---');

  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.get();

  const purchasedBadges: SupabasePurchasedBadge[] = [];

  for (const userDoc of snapshot.docs) {
    const username = usernameMap.get(userDoc.id) || userDoc.id;

    try {
      const badgesSnapshot = await userDoc.ref.collection('purchasedBadges').get();

      for (const badgeDoc of badgesSnapshot.docs) {
        const data = badgeDoc.data();
        purchasedBadges.push({
          username,
          badge_id: badgeDoc.id,
          purchased_at: timestampToISO(data.purchasedAt) || new Date().toISOString(),
        });
      }
    } catch (e) {
      // Subcollection doesn't exist, skip
    }
  }

  console.log(`Found ${purchasedBadges.length} purchased badges.`);

  if (purchasedBadges.length === 0) {
    console.log('No purchased badges to migrate.');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < purchasedBadges.length; i += BATCH_SIZE) {
    const batch = purchasedBadges.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('purchased_badges').upsert(batch, {
      onConflict: 'username,badge_id',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error(`Error inserting purchased badges batch:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted purchased badges: ${insertedCount}/${purchasedBadges.length}`);
    }
  }

  console.log(`✅ Purchased badges migration complete: ${insertedCount} inserted`);
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/migrate-users.ts <path-to-service-account.json>');
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
    const usernameMap = await migrateUsers(firestore, supabase);
    await migrateBadgeStats(firestore, supabase, usernameMap);
    await migratePurchasedBadges(firestore, supabase, usernameMap);

    console.log('\n✅ All user migrations complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
