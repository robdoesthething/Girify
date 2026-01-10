import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const USERS_COLLECTION = 'users';

const sanitize = name => name.toLowerCase().replace(/\//g, '_');

const reconcileFriendships = async () => {
  console.log('Starting Friendship Reconciliation...');

  const usersSnap = await db.collection(USERS_COLLECTION).get();
  let totalFixed = 0;
  let totalDeleted = 0;

  for (const userDoc of usersSnap.docs) {
    const username = userDoc.id;
    const cleanUsername = sanitize(username);
    const friendsRef = userDoc.ref.collection('friends');
    const friendsSnap = await friendsRef.get();

    if (friendsSnap.empty) continue;

    const seenFriends = new Map(); // cleanName -> docId
    const batch = db.batch();
    let batchCount = 0;

    for (const friendDoc of friendsSnap.docs) {
      const friendData = friendDoc.data();
      const rawFriendName = friendData.username || friendDoc.id;
      const cleanFriendName = sanitize(rawFriendName);

      // 1. Remove Self-Friendship
      if (cleanFriendName === cleanUsername) {
        console.log(`[${username}] Removing self-friendship: ${friendDoc.id}`);
        batch.delete(friendDoc.ref);
        batchCount++;
        totalDeleted++;
        continue;
      }

      // 2. Remove Duplicates
      if (seenFriends.has(cleanFriendName)) {
        console.log(
          `[${username}] Removing duplicate friend: ${cleanFriendName} (Doc: ${friendDoc.id})`
        );
        batch.delete(friendDoc.ref);
        batchCount++;
        totalDeleted++;
      } else {
        seenFriends.set(cleanFriendName, friendDoc.id);

        // Optional: Ensure Doc ID matches sanitized name (Migration)
        // If Doc ID involves upper case or weird chars, we could migrate it,
        // but deleting strict duplicates is the priority.
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      totalFixed++;
    }
  }

  console.log(`Reconciliation Complete.`);
  console.log(`Users fixed: ${totalFixed}`);
  console.log(`Friendship entries deleted: ${totalDeleted}`);
};

reconcileFriendships().catch(console.error);
