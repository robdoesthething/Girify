import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Harmonize Database Script
 *
 * Usage: node scripts/harmonizeDatabase.js <path-to-service-account.json>
 */

const run = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Please provide path to service account json');
    console.error('Usage: node scripts/harmonizeDatabase.js ./service-account.json');
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

    // Shared Cache
    const userEmailCache = new Map();

    await harmonizeFriendships(db, userEmailCache);
    await harmonizeScores(db, userEmailCache);
    await harmonizeReferrals(db, userEmailCache);
    await harmonizeHighscores(db, userEmailCache);
    await harmonizeUserStats(db);

    console.log('✅ Harmonization Complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// --- Helpers ---

async function getEmailForUser(db, cache, username) {
  if (!username) return null;
  const userId = username.toLowerCase();

  if (cache.has(userId)) {
    const cached = cache.get(userId);
    return cached === 'NOT_FOUND' ? null : cached;
  }

  const usersRef = db.collection('users');
  let email = null;

  // Try exact ID match
  let userSnap = await usersRef.doc(userId).get();
  if (!userSnap.exists) {
    // Try without @ if current has it, or with @ if current doesn't
    const altId = userId.startsWith('@') ? userId.slice(1) : `@${userId}`;
    userSnap = await usersRef.doc(altId).get();
  }

  if (userSnap.exists) {
    email = userSnap.data().email;
  }

  cache.set(userId, email || 'NOT_FOUND');
  return email;
}

// --- Transformations ---

async function harmonizeFriendships(db, emailCache) {
  console.log('\n--- 1. Harmonizing Friendships ---');
  const friendshipsRef = db.collection('friendships');
  const snapshot = await friendshipsRef.get();

  console.log(`Found ${snapshot.size} friendship documents.`);

  let batchSize = 0;
  let currentBatch = db.batch();

  const commitBatch = async () => {
    if (batchSize > 0) {
      await currentBatch.commit();
      currentBatch = db.batch();
      batchSize = 0;
    }
  };

  const existingDocs = new Map();
  snapshot.docs.forEach(d => existingDocs.set(d.id, d));
  const pairsProcessed = new Set();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.user1 || !data.user2) continue;

    // Normalize users for key
    const users = [data.user1, data.user2].sort();
    const compositeKey = `${users[0]}_${users[1]}`;

    // Check if duplicate for this session
    if (pairsProcessed.has(compositeKey)) {
      // If we already processed this pair, implies we found/created the canonical one.
      // If current doc is NOT the canonical key, delete it as duplicate.
      if (doc.id !== compositeKey) {
        currentBatch.delete(doc.ref);
        batchSize++;
        console.log(`[DELETE] Duplicate/Legacy ${doc.id}`);
      }
      continue;
    }
    pairsProcessed.add(compositeKey);

    // Backfill emails
    const email1 = await getEmailForUser(db, emailCache, data.user1);
    const email2 = await getEmailForUser(db, emailCache, data.user2);

    // Prepare Updates for CANONICAL version
    // Even if we are deleting this doc, we want to migrate its data + updates to canonical.
    const updates = {};
    if (!data.participants) updates.participants = users;
    if (!data.user1Email && email1) updates.user1Email = email1;
    if (!data.user2Email && email2) updates.user2Email = email2;

    const targetDoc = existingDocs.get(compositeKey);

    if (targetDoc) {
      // Canonical doc exists in DB.
      if (doc.id === compositeKey) {
        // We are currently processing the canonical one. Update it.
        if (Object.keys(updates).length > 0) {
          currentBatch.update(doc.ref, updates);
          batchSize++;
          // console.log(`[UPDATE] Canonical ${doc.id}`);
        }
      } else {
        // We are processing a legacy doc, but canonical exists.
        // Delete legacy. Ensure canonical is updated?
        // The loop will eventually hit the canonical doc (or already has).
        // If we hit canonical later, we update then.
        // If we hit canonical earlier, we updated then.
        // BUT: The legacy doc might have newer data? Unlikely for this schema.
        // Assume duplicate data is identical or canonical is source of truth.
        currentBatch.delete(doc.ref);
        batchSize++;
        console.log(`[DELETE] Legacy ${doc.id} (Canonical exists)`);
      }
    } else {
      // Canonical doc DOES NOT exist in DB.
      // Migrate THIS doc to be the canonical one.
      const newRef = friendshipsRef.doc(compositeKey);
      currentBatch.set(newRef, {
        ...data,
        ...updates,
        updatedAt: new Date(), // Force update timestamp
      });
      currentBatch.delete(doc.ref);
      batchSize += 2;
      console.log(`[MIGRATE] ${doc.id} -> ${compositeKey}`);

      // Add to existingDocs conceptually so next loop doesn't recreate?
      // pairsProcessed handles loop logic.
    }

    if (batchSize >= 400) await commitBatch();
  }

  await commitBatch();
  console.log('Friendships harmonized.');
}

async function harmonizeScores(db, emailCache) {
  console.log('\n--- 2. Harmonizing Scores (Backfill Email) ---');
  const scoresRef = db.collection('scores');
  const snapshot = await scoresRef.get();
  console.log(`Found ${snapshot.size} score documents.`);

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
    if (data.email) continue;

    const username = data.username;
    if (!username) continue;

    const email = await getEmailForUser(db, emailCache, username);

    if (email) {
      currentBatch.update(doc.ref, { email: email });
      batchSize++;
      updatedCount++;
      if (batchSize >= 400) await commitBatch();
    }
  }

  await commitBatch();
  console.log(`Updated ${updatedCount} scores with emails.`);
}

async function harmonizeReferrals(db, emailCache) {
  console.log('\n--- 3. Harmonizing Referrals (Backfill Email) ---');
  const refCollection = db.collection('referrals');
  const snapshot = await refCollection.get();
  console.log(`Found ${snapshot.size} referral documents.`);

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
    const u1 = data.referrer;
    const u2 = data.referred;

    const email1 = await getEmailForUser(db, emailCache, u1);
    const email2 = await getEmailForUser(db, emailCache, u2);

    const updates = {};
    if (!data.referrerEmail && email1) updates.referrerEmail = email1;
    if (!data.referredEmail && email2) updates.referredEmail = email2;

    if (Object.keys(updates).length > 0) {
      currentBatch.update(doc.ref, updates);
      batchSize++;
      updatedCount++;
      if (batchSize >= 400) await commitBatch();
    }
  }
  await commitBatch();
  console.log(`Updated ${updatedCount} referrals.`);
}

async function harmonizeHighscores(db, emailCache) {
  console.log('\n--- 4. Harmonizing Highscores (Backfill Email) ---');
  const highscoresRef = db.collection('highscores');
  const snapshot = await highscoresRef.get();
  console.log(`Found ${snapshot.size} highscore documents.`);

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
    if (data.email) continue;

    // Highscore ID is usually the username (sanitized)
    const username = data.username || doc.id;

    const email = await getEmailForUser(db, emailCache, username);

    if (email) {
      currentBatch.update(doc.ref, { email: email });
      batchSize++;
      updatedCount++;
      if (batchSize >= 400) await commitBatch();
    }
  }
  await commitBatch();
  console.log(`Updated ${updatedCount} highscores.`);
}

async function harmonizeUserStats(db) {
  console.log('\n--- 5. Harmonizing User Stats ---');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let batchSize = 0;
  let currentBatch = db.batch();
  let fixCount = 0;

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

    // Rule: Streak cannot be higher than gamesPlayed
    const gamesPlayed = data.gamesPlayed || 0;
    const streak = data.streak || 0;

    if (streak > gamesPlayed) {
      updates.streak = gamesPlayed;
      console.log(`[Fix] ${doc.id}: streak ${streak} -> ${gamesPlayed}`);
    }

    if (Object.keys(updates).length > 0) {
      currentBatch.update(doc.ref, updates);
      batchSize++;
      fixCount++;

      if (batchSize >= 400) await commitBatch();
    }
  }

  await commitBatch();
  console.log(`Fixed stats for ${fixCount} users.`);
}

run();
