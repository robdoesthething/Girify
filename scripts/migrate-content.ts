/**
 * Migrate Content Script
 *
 * Migrates Firestore content collections to Supabase:
 * - shop_items → shop_items table
 * - achievements → achievements table
 * - quests → quests table
 * - announcements → announcements table
 * - districts → districts table
 *
 * Usage: npx tsx scripts/migrate-content.ts <path-to-service-account.json>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Types
interface FirestoreShopItem {
  id?: string;
  type: string;
  name: string;
  cost: number;
  rarity?: string;
  color?: string;
  description?: string;
  image?: string;
  emoji?: string;
  cssClass?: string;
  flavorText?: string;
  prefix?: string;
  isActive?: boolean;
}

interface FirestoreAchievement {
  id?: string;
  name: string;
  description?: string;
  emoji?: string;
  criteria?: string;
  rarity?: string;
  category?: string;
  unlockCondition?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

interface FirestoreQuest {
  id?: string;
  title: string;
  description?: string;
  criteriaType: string;
  criteriaValue?: string | number;
  rewardGiuros?: number;
  activeDate?: string;
  isActive?: boolean;
  createdAt?: number | Timestamp;
}

interface FirestoreAnnouncement {
  title: string;
  body: string;
  publishDate?: Timestamp | Date;
  expiryDate?: Timestamp | Date | null;
  isActive?: boolean;
  priority?: string;
  targetAudience?: string;
  createdAt?: Timestamp;
}

interface FirestoreDistrict {
  id?: string;
  name: string;
  teamName?: string;
  score?: number;
  memberCount?: number;
}

interface SupabaseShopItem {
  id: string;
  type: string;
  name: string;
  cost: number;
  rarity: string | null;
  color: string | null;
  description: string | null;
  image: string | null;
  emoji: string | null;
  css_class: string | null;
  flavor_text: string | null;
  prefix: string | null;
  is_active: boolean;
}

interface SupabaseAchievement {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  criteria: string | null;
  rarity: string | null;
  category: string | null;
  unlock_condition: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
}

interface SupabaseQuest {
  title: string;
  description: string | null;
  criteria_type: string;
  criteria_value: string | null;
  reward_giuros: number;
  active_date: string | null;
  is_active: boolean;
}

interface SupabaseAnnouncement {
  title: string;
  body: string;
  publish_date: string;
  expiry_date: string | null;
  is_active: boolean;
  priority: string;
  target_audience: string;
}

interface SupabaseDistrict {
  id: string;
  name: string;
  team_name: string | null;
  score: number;
  member_count: number;
}

// Helper functions
function timestampToISO(ts: Timestamp | Date | undefined | null): string {
  if (!ts) return new Date().toISOString();
  try {
    if (ts instanceof Date) {
      return ts.toISOString();
    }
    if ('toDate' in ts && typeof ts.toDate === 'function') {
      return ts.toDate().toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
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
function transformShopItem(docId: string, data: FirestoreShopItem): SupabaseShopItem {
  return {
    id: data.id || docId,
    type: data.type,
    name: data.name,
    cost: data.cost,
    rarity: data.rarity || null,
    color: data.color || null,
    description: data.description || null,
    image: data.image || null,
    emoji: data.emoji || null,
    css_class: data.cssClass || null,
    flavor_text: data.flavorText || null,
    prefix: data.prefix || null,
    is_active: data.isActive !== false,
  };
}

function transformAchievement(docId: string, data: FirestoreAchievement): SupabaseAchievement {
  return {
    id: data.id || docId,
    name: data.name,
    description: data.description || null,
    emoji: data.emoji || null,
    criteria: data.criteria || null,
    rarity: data.rarity || null,
    category: data.category || null,
    unlock_condition: data.unlockCondition || null,
    is_active: data.isActive !== false,
    sort_order: data.sortOrder || 0,
  };
}

function transformQuest(data: FirestoreQuest): SupabaseQuest {
  return {
    title: data.title,
    description: data.description || null,
    criteria_type: data.criteriaType,
    criteria_value: data.criteriaValue?.toString() || null,
    reward_giuros: data.rewardGiuros || 0,
    active_date: data.activeDate || null,
    is_active: data.isActive !== false,
  };
}

function transformAnnouncement(data: FirestoreAnnouncement): SupabaseAnnouncement {
  return {
    title: data.title,
    body: data.body,
    publish_date: timestampToISO(data.publishDate),
    expiry_date: data.expiryDate ? timestampToISO(data.expiryDate) : null,
    is_active: data.isActive !== false,
    priority: data.priority || 'normal',
    target_audience: data.targetAudience || 'all',
  };
}

function transformDistrict(docId: string, data: FirestoreDistrict): SupabaseDistrict {
  return {
    id: data.id || docId,
    name: data.name,
    team_name: data.teamName || null,
    score: data.score || 0,
    member_count: data.memberCount || 0,
  };
}

// Migration functions
async function migrateShopItems(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Shop Items ---');

  const shopRef = firestore.collection('shop_items');
  const snapshot = await shopRef.get();

  console.log(`Found ${snapshot.size} shop items.`);

  if (snapshot.empty) {
    console.log('No shop items to migrate.');
    return;
  }

  const items: SupabaseShopItem[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreShopItem;
    items.push(transformShopItem(doc.id, data));
  }

  const { error } = await supabase.from('shop_items').upsert(items, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Error inserting shop items:', error.message);
  } else {
    console.log(`✅ Inserted ${items.length} shop items`);
  }
}

async function migrateAchievements(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Achievements ---');

  const achievementsRef = firestore.collection('achievements');
  const snapshot = await achievementsRef.get();

  console.log(`Found ${snapshot.size} achievements.`);

  if (snapshot.empty) {
    console.log('No achievements to migrate.');
    return;
  }

  const achievements: SupabaseAchievement[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreAchievement;
    achievements.push(transformAchievement(doc.id, data));
  }

  const { error } = await supabase.from('achievements').upsert(achievements, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Error inserting achievements:', error.message);
  } else {
    console.log(`✅ Inserted ${achievements.length} achievements`);
  }
}

async function migrateQuests(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Quests ---');

  const questsRef = firestore.collection('quests');
  const snapshot = await questsRef.get();

  console.log(`Found ${snapshot.size} quests.`);

  if (snapshot.empty) {
    console.log('No quests to migrate.');
    return;
  }

  const quests: SupabaseQuest[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreQuest;
    quests.push(transformQuest(data));
  }

  const { error } = await supabase.from('quests').insert(quests);

  if (error) {
    console.error('Error inserting quests:', error.message);
  } else {
    console.log(`✅ Inserted ${quests.length} quests`);
  }
}

async function migrateAnnouncements(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Announcements ---');

  const announcementsRef = firestore.collection('announcements');
  const snapshot = await announcementsRef.get();

  console.log(`Found ${snapshot.size} announcements.`);

  if (snapshot.empty) {
    console.log('No announcements to migrate.');
    return;
  }

  const announcements: SupabaseAnnouncement[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreAnnouncement;
    announcements.push(transformAnnouncement(data));
  }

  const { error } = await supabase.from('announcements').insert(announcements);

  if (error) {
    console.error('Error inserting announcements:', error.message);
  } else {
    console.log(`✅ Inserted ${announcements.length} announcements`);
  }
}

async function migrateDistricts(firestore: Firestore, supabase: SupabaseClient): Promise<void> {
  console.log('\n--- Migrating Districts ---');

  const districtsRef = firestore.collection('districts');
  const snapshot = await districtsRef.get();

  console.log(`Found ${snapshot.size} districts.`);

  if (snapshot.empty) {
    console.log('No districts to migrate.');
    return;
  }

  const districts: SupabaseDistrict[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as FirestoreDistrict;
    districts.push(transformDistrict(doc.id, data));
  }

  const { error } = await supabase.from('districts').upsert(districts, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Error inserting districts:', error.message);
  } else {
    console.log(`✅ Inserted ${districts.length} districts`);
  }
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/migrate-content.ts <path-to-service-account.json>');
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
    await migrateShopItems(firestore, supabase);
    await migrateAchievements(firestore, supabase);
    await migrateQuests(firestore, supabase);
    await migrateAnnouncements(firestore, supabase);
    await migrateDistricts(firestore, supabase);

    console.log('\n✅ All content migrations complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
