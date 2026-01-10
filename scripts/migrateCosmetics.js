import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

// Construct __dirname in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Cosmetics Migration Script
 *
 * Usage: node scripts/migrateCosmetics.js <path-to-service-account.json>
 */
const run = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Please provide path to service account json');
    console.error('Usage: node scripts/migrateCosmetics.js ./service-account.json');
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

    // Load cosmetics.json
    const cosmeticsPath = path.resolve(process.cwd(), 'src/data/cosmetics.json');
    const cosmetics = JSON.parse(await readFile(cosmeticsPath, 'utf8'));

    const shopItemsRef = db.collection('shop_items');

    // Flatten and upload
    let batch = db.batch();
    let count = 0;
    let uploaded = 0;

    const commitBatch = async () => {
      if (count > 0) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    };

    // Helper to process items
    const processItems = (items, type) => {
      items.forEach(item => {
        const docRef = shopItemsRef.doc(item.id);

        // Ensure type is set
        const data = {
          ...item,
          type: type,
        };

        batch.set(docRef, data, { merge: true });
        count++;
        uploaded++;

        if (count >= 400) {
          // Cannot await inside forEach with this logic easily, but synchronous batch Add is fine.
          // We can commit periodically. However, since this is small data,
          // we can just let count go up. Wait... Firebase batch limit is 500.
          // Let's execute immediately if we hit limit.
          // Note: using async inside forEach is tricky. Let's use for...of loop in main function.
        }
      });
    };

    const allItems = [];
    if (cosmetics.avatarFrames) {
      cosmetics.avatarFrames.forEach(i => allItems.push({ ...i, type: 'frame' }));
    }
    if (cosmetics.titles) {
      cosmetics.titles.forEach(i => allItems.push({ ...i, type: 'title' }));
    }
    if (cosmetics.special) {
      cosmetics.special.forEach(i => allItems.push({ ...i, type: 'special' }));
    }

    console.log(`Found ${allItems.length} items to migrate.`);

    for (const item of allItems) {
      const docRef = shopItemsRef.doc(item.id);
      batch.set(docRef, item, { merge: true });
      count++;
      uploaded++;

      if (count >= 400) {
        await commitBatch();
        console.log(`Committed batch of 400...`);
      }
    }

    if (count > 0) {
      await commitBatch();
    }

    console.log(`✅ Migration Complete. Uploaded ${uploaded} items.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
