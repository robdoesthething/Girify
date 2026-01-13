import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Update Roberto Name Script
 *
 * Sets realName = 'Roberto' for users containing 'roberto' in their ID or email.
 */

const run = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/updateRobertoName.js ./service-account.json');
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

    await updateNames(db);

    console.log('✅ Update Complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

async function updateNames(db) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get(); // Get ALL users first, safer for small DB

  console.log(`Scanning ${snapshot?.size || 0} users...`); // Handle potential undefined snapshot
  if (!snapshot) return;

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const id = doc.id.toLowerCase();
    const email = (data.email || '').toLowerCase();

    // Check if it's a "Roberto" user
    if (id.includes('roberto') || email.includes('roberto')) {
      batch.update(doc.ref, { realName: 'Roberto' });
      count++;
      console.log(`[UPDATE] Setting realName='Roberto' for user: ${doc.id}`);
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} users.`);
  } else {
    console.log('No matching users found.');
  }
}

run();
