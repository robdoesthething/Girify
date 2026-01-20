/**
 * Migrate Social Script
 *
 * Migrates Firestore social collections to Supabase:
 * - users/{}/friends → friendships table
 * - users/{}/requests → friend_requests table
 * - blocks → blocks table
 * - referrals → referrals table
 * - activityFeed → activity_feed table
 * - userReadAnnouncements → user_read_announcements table
 * - feedback → feedback table
 *
 * Usage: npx tsx scripts/migrate-social.ts <path-to-service-account.json>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Types
interface FirestoreFriend {
  username?: string;
  since?: Timestamp;
}

interface FirestoreFriendRequest {
  from: string;
  timestamp?: Timestamp;
  status?: string;
}

interface FirestoreBlock {
  blocker: string;
  blocked: string;
  createdAt?: Timestamp;
}

interface FirestoreReferral {
  referrer: string;
  referred: string;
  referrerEmail?: string | null;
  referredEmail?: string | null;
  bonusAwarded?: boolean;
  createdAt?: Timestamp;
}

interface FirestoreActivity {
  username: string;
  type: string;
  timestamp?: Timestamp;
  score?: number;
  time?: number;
  badgeId?: string;
  badgeName?: string;
  oldUsername?: string;
  itemId?: string;
  itemName?: string;
  itemType?: string;
}

interface FirestoreFeedback {
  username: string;
  text: string;
  status?: string;
  reward?: number | null;
  notified?: boolean;
  createdAt?: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
}

interface SupabaseFriendship {
  user_a: string;
  user_b: string;
  created_at: string;
}

interface SupabaseFriendRequest {
  from_user: string;
  to_user: string;
  status: string;
  created_at: string;
}

interface SupabaseBlock {
  blocker: string;
  blocked: string;
  created_at: string;
}

interface SupabaseReferral {
  referrer: string;
  referred: string;
  referrer_email: string | null;
  referred_email: string | null;
  bonus_awarded: boolean;
  created_at: string;
}

interface SupabaseActivity {
  username: string;
  type: string;
  created_at: string;
  score: number | null;
  time_taken: number | null;
  badge_id: string | null;
  badge_name: string | null;
  old_username: string | null;
  item_id: string | null;
  item_name: string | null;
  item_type: string | null;
  metadata: Record<string, unknown>;
}

interface SupabaseFeedback {
  username: string;
  text: string;
  status: string;
  reward: number | null;
  notified: boolean;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

interface SupabaseReadAnnouncement {
  username: string;
  announcement_id: number;
  read_at: string;
}

// Helper functions
function timestampToISO(ts: Timestamp | undefined | null): string {
  if (!ts) return new Date().toISOString();
  try {
    return ts.toDate().toISOString();
  } catch {
    return new Date().toISOString();
  }
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

// Migration functions
async function migrateFriendships(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Friendships ---');

  const usersRef = firestore.collection('users');
  const usersSnapshot = await usersRef.get();

  console.log(`Scanning ${usersSnapshot.size} users for friendships...`);

  const friendships: SupabaseFriendship[] = [];
  const seenPairs = new Set<string>();

  for (const userDoc of usersSnapshot.docs) {
    const username = userDoc.id.toLowerCase();

    try {
      const friendsSnapshot = await userDoc.ref.collection('friends').get();

      for (const friendDoc of friendsSnapshot.docs) {
        const data = friendDoc.data() as FirestoreFriend;
        const friendUsername = (data.username || friendDoc.id).toLowerCase();

        if (username === friendUsername) continue;

        // Create ordered pair to avoid duplicates
        // IMPORTANT: user_a < user_b for CHECK constraint
        const [userA, userB] = [username, friendUsername].sort();
        const pairKey = `${userA}-${userB}`;

        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          friendships.push({
            user_a: userA,
            user_b: userB,
            created_at: timestampToISO(data.since),
          });
        }
      }
    } catch (e) {
      // Subcollection doesn't exist, skip
    }
  }

  console.log(`Found ${friendships.length} unique friendships.`);

  if (friendships.length === 0) {
    console.log('No friendships to migrate.');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < friendships.length; i += BATCH_SIZE) {
    const batch = friendships.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('friendships').upsert(batch, {
      onConflict: 'user_a,user_b',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error(`Error inserting friendships batch:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log(`Inserted friendships: ${insertedCount}/${friendships.length}`);
    }
  }

  console.log(`✅ Friendships migration complete: ${insertedCount} inserted, ${errorCount} errors`);
}

async function migrateFriendRequests(
  firestore: Firestore,
  supabase: SupabaseClient
): Promise<void> {
  console.log('\n--- Migrating Friend Requests ---');

  const usersRef = firestore.collection('users');
  const usersSnapshot = await usersRef.get();

  const requests: SupabaseFriendRequest[] = [];
  const seenPairs = new Set<string>();

  for (const userDoc of usersSnapshot.docs) {
    const toUsername = userDoc.id.toLowerCase();

    try {
      const requestsSnapshot = await userDoc.ref.collection('requests').get();

      for (const requestDoc of requestsSnapshot.docs) {
        const data = requestDoc.data() as FirestoreFriendRequest;
        const fromUsername = data.from?.toLowerCase() || requestDoc.id.toLowerCase();

        // Avoid duplicates
        const pairKey = `${fromUsername}-${toUsername}`;
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          requests.push({
            from_user: fromUsername,
            to_user: toUsername,
            status: data.status || 'pending',
            created_at: timestampToISO(data.timestamp),
          });
        }
      }
    } catch (e) {
      // Subcollection doesn't exist, skip
    }
  }

  console.log(`Found ${requests.length} friend requests.`);

  if (requests.length === 0) {
    console.log('No friend requests to migrate.');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('friend_requests').upsert(batch, {
      onConflict: 'from_user,to_user',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error(`Error inserting friend requests batch:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted friend requests: ${insertedCount}/${requests.length}`);
    }
  }

  console.log(`✅ Friend requests migration complete: ${insertedCount} inserted`);
}

async function migrateBlocks(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Blocks ---');

  const blocksRef = firestore.collection('blocks');
  const snapshot = await blocksRef.get();

  console.log(`Found ${snapshot.size} block documents.`);

  if (snapshot.empty) {
    console.log('No blocks to migrate.');
    return;
  }

  const blocks: SupabaseBlock[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreBlock;
    blocks.push({
      blocker: data.blocker.toLowerCase(),
      blocked: data.blocked.toLowerCase(),
      created_at: timestampToISO(data.createdAt),
    });
  }

  const { error } = await supabase.from('blocks').upsert(blocks, {
    onConflict: 'blocker,blocked',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error('Error inserting blocks:', error.message);
  } else {
    console.log(`✅ Inserted ${blocks.length} blocks`);
  }
}

async function migrateReferrals(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Referrals ---');

  const referralsRef = firestore.collection('referrals');
  const snapshot = await referralsRef.get();

  console.log(`Found ${snapshot.size} referral documents.`);

  if (snapshot.empty) {
    console.log('No referrals to migrate.');
    return;
  }

  const referrals: SupabaseReferral[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreReferral;
    referrals.push({
      referrer: data.referrer.toLowerCase(),
      referred: data.referred.toLowerCase(),
      referrer_email: data.referrerEmail || null,
      referred_email: data.referredEmail || null,
      bonus_awarded: data.bonusAwarded || false,
      created_at: timestampToISO(data.createdAt),
    });
  }

  const { error } = await supabase.from('referrals').upsert(referrals, {
    onConflict: 'referred',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error('Error inserting referrals:', error.message);
  } else {
    console.log(`✅ Inserted ${referrals.length} referrals`);
  }
}

async function migrateActivityFeed(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Activity Feed ---');

  const activityRef = firestore.collection('activityFeed');
  const snapshot = await activityRef.get();

  console.log(`Found ${snapshot.size} activity documents.`);

  if (snapshot.empty) {
    console.log('No activity to migrate.');
    return;
  }

  const activities: SupabaseActivity[] = [];
  const validTypes = ['daily_score', 'badge_earned', 'username_changed', 'cosmetic_purchased'];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreActivity;

    // Validate type or map to valid type
    let type = data.type;
    if (!validTypes.includes(type)) {
      type = 'daily_score'; // Default fallback
    }

    activities.push({
      username: data.username.toLowerCase(),
      type,
      created_at: timestampToISO(data.timestamp),
      score: data.score ?? null,
      time_taken: data.time ?? null,
      badge_id: data.badgeId || null,
      badge_name: data.badgeName || null,
      old_username: data.oldUsername || null,
      item_id: data.itemId || null,
      item_name: data.itemName || null,
      item_type: data.itemType || null,
      metadata: {},
    });
  }

  // Insert in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < activities.length; i += BATCH_SIZE) {
    const batch = activities.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('activity_feed').insert(batch);

    if (error) {
      console.error(`Error inserting activity batch:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted activity: ${insertedCount}/${activities.length}`);
    }
  }

  console.log(`✅ Activity feed migration complete: ${insertedCount} inserted`);
}

async function migrateFeedback(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Feedback ---');

  const feedbackRef = firestore.collection('feedback');
  const snapshot = await feedbackRef.get();

  console.log(`Found ${snapshot.size} feedback documents.`);

  if (snapshot.empty) {
    console.log('No feedback to migrate.');
    return;
  }

  const feedbackItems: SupabaseFeedback[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreFeedback;
    feedbackItems.push({
      username: data.username.toLowerCase(),
      text: data.text,
      status: data.status || 'pending',
      reward: data.reward ?? null,
      notified: data.notified || false,
      created_at: timestampToISO(data.createdAt),
      approved_at: data.approvedAt ? timestampToISO(data.approvedAt) : null,
      rejected_at: data.rejectedAt ? timestampToISO(data.rejectedAt) : null,
    });
  }

  const { error } = await supabase.from('feedback').insert(feedbackItems);

  if (error) {
    console.error('Error inserting feedback:', error.message);
  } else {
    console.log(`✅ Inserted ${feedbackItems.length} feedback items`);
  }
}

async function migrateUserReadAnnouncements(
  firestore: Firestore,
  supabase: SupabaseClient
): Promise<void> {
  console.log('\n--- Migrating User Read Announcements ---');

  const readAnnouncementsRef = firestore.collection('userReadAnnouncements');
  const snapshot = await readAnnouncementsRef.get();

  console.log(`Found ${snapshot.size} read announcement documents.`);

  if (snapshot.empty) {
    console.log('No read announcements to migrate.');
    return;
  }

  // First, get announcement mapping (title -> id) from Supabase
  const { data: announcements } = await supabase.from('announcements').select('id, title');

  const announcementMap = new Map<string, number>();
  if (announcements) {
    announcements.forEach((a: { id: number; title: string }) => {
      announcementMap.set(a.title.toLowerCase(), a.id);
    });
  }

  const readItems: SupabaseReadAnnouncement[] = [];

  for (const doc of snapshot.docs) {
    // Document ID format is typically: username_announcementId or similar
    const data = doc.data();
    const username = data.username?.toLowerCase() || doc.id.split('_')[0]?.toLowerCase();
    const announcementTitle = data.title?.toLowerCase();

    if (username && announcementTitle && announcementMap.has(announcementTitle)) {
      readItems.push({
        username,
        announcement_id: announcementMap.get(announcementTitle)!,
        read_at: timestampToISO(data.readAt),
      });
    }
  }

  console.log(`Mapped ${readItems.length} read announcements.`);

  if (readItems.length === 0) {
    console.log('No mappable read announcements found.');
    return;
  }

  const { error } = await supabase.from('user_read_announcements').upsert(readItems, {
    onConflict: 'username,announcement_id',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error('Error inserting read announcements:', error.message);
  } else {
    console.log(`✅ Inserted ${readItems.length} read announcements`);
  }
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/migrate-social.ts <path-to-service-account.json>');
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
    await migrateFriendships(firestore, supabase);
    await migrateFriendRequests(firestore, supabase);
    await migrateBlocks(firestore, supabase);
    await migrateReferrals(firestore, supabase);
    await migrateActivityFeed(firestore, supabase);
    await migrateFeedback(firestore, supabase);
    await migrateUserReadAnnouncements(firestore, supabase);

    console.log('\n✅ All social migrations complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
