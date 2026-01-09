/**
 * Migration Script: Backfill existing users with new profile fields
 *
 * Run with: node scripts/migrateUserProfiles.js
 *
 * Prerequisites:
 * 1. Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path
 * 2. Or run: npx firebase-tools login
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// Uses Application Default Credentials (ADC) or service account
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const USERS_COLLECTION = 'users';

// Default values for new fields
const NEW_FIELD_DEFAULTS = {
  streak: 0,
  maxStreak: 0,
  lastPlayDate: null,
  totalScore: 0,
  language: 'en',
  theme: 'auto',
  notificationSettings: {
    dailyReminder: true,
    friendActivity: true,
    newsUpdates: true,
  },
  // createdAt and updatedAt will be set to joinedAt if missing
};

/**
 * Migrate a single user document
 */
const migrateUser = async (docRef, data) => {
  const updates = {};
  let needsUpdate = false;

  // Add missing fields with defaults
  for (const [field, defaultValue] of Object.entries(NEW_FIELD_DEFAULTS)) {
    if (data[field] === undefined) {
      updates[field] = defaultValue;
      needsUpdate = true;
    }
  }

  // Set createdAt to joinedAt if missing
  if (!data.createdAt && data.joinedAt) {
    updates.createdAt = data.joinedAt;
    needsUpdate = true;
  }

  // Set updatedAt to now if missing
  if (!data.updatedAt) {
    updates.updatedAt = Timestamp.now();
    needsUpdate = true;
  }

  if (needsUpdate) {
    await docRef.update(updates);
    return true;
  }
  return false;
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log('Starting user profile migration...\n');

  const usersRef = db.collection(USERS_COLLECTION);
  const snapshot = await usersRef.get();

  console.log(`Found ${snapshot.size} users to process.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    try {
      const wasMigrated = await migrateUser(doc.ref, doc.data());
      if (wasMigrated) {
        migrated++;
        console.log(`✓ Migrated: ${doc.id}`);
      } else {
        skipped++;
      }
    } catch (e) {
      errors++;
      console.error(`✗ Error migrating ${doc.id}:`, e.message);
    }
  }

  console.log('\n--- Migration Complete ---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already up-to-date): ${skipped}`);
  console.log(`Errors: ${errors}`);
};

// Run the migration
runMigration().catch(console.error);
