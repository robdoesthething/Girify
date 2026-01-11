import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Migrate User Fields Script
 *
 * Usage: node scripts/migrateUserFields.js <path-to-service-account.json>
 */

const run = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Please provide path to service account json');
    console.error('Usage: node scripts/migrateUserFields.js ./service-account.json');
    process.exit(1);
  }

  const serviceAccountPath = path.resolve(process.cwd(), args[0]);

  try {
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

    initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore();
    console.log('🔥 Firebase Admin Initialized');

    await migrateUsers(db);

    console.log('✅ Migration Complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

async function migrateUsers(db) {
  console.log('\n--- Migrating Users ---');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  console.log(`Found ${snapshot.size} user documents.`);

  let batchSize = 0;
  let currentBatch = db.batch();
  let updatedCount = 0;

  const commitBatch = async () => {
    if (batchSize > 0) {
      await currentBatch.commit();
      currentBatch = db.batch();
      batchSize = 0;
    }
  };

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    // 1. Ensure 'streak' exists
    if (typeof data.streak === 'undefined') {
      updates.streak = 0;
    }

    // 2. Ensure 'realName' exists
    if (typeof data.realName === 'undefined') {
      // Logic: If they have a displayName that isn't their username, use it.
      // Otherwise empty string.
      // Note: Usually displayName in auth matches username or email, so safer to default to empty
      // and let them fill it in via UI.
      updates.realName = '';
    }

    // 3. Ensure 'giuros' exists (new currency)
    if (typeof data.giuros === 'undefined') {
      updates.giuros = 100; // Give some starter cash to legacy users!
    }

    // 4. Ensure 'inventory' exists
    if (typeof data.inventory === 'undefined') {
      updates.inventory = [];
    }

    // 5. Ensure 'equippedCosmetics' exists
    if (typeof data.equippedCosmetics === 'undefined') {
      updates.equippedCosmetics = {
        titleId: 'title_explorer',
        frameId: 'frame_default',
        avatarId: 'avatar_guiri',
      };
    }

    if (Object.keys(updates).length > 0) {
      currentBatch.update(doc.ref, updates);
      batchSize++;
      updatedCount++;
      // console.log(`[Update] ${doc.id}: ${JSON.stringify(updates)}`);

      if (batchSize >= 400) await commitBatch();
    }
  }

  await commitBatch();
  console.log(`Updated ${updatedCount} users with missing fields.`);
}

run();
