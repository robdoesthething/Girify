import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import path from 'path';
import readline from 'readline';

/**
 * Publish News Script
 *
 * Usage: node scripts/publishNews.js <service-account.json>
 */

const run = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/publishNews.js ./service-account.json');
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

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = query => new Promise(resolve => rl.question(query, resolve));

    console.log('\n--- Publish New Announcement ---\n');

    const title = await question('Title (e.g. "Update v0.2.0"): ');
    const body = await question('Body (use \\n for newlines): ');
    const priority = (await question('Priority (normal/high/urgent) [normal]: ')) || 'normal';
    const confirm = await question(`\nPublish "${title}"? (y/N): `);

    if (confirm.toLowerCase() === 'y') {
      const collection = db.collection('announcements');

      const now = new Date();
      // Default expiry 7 days from now
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      await collection.add({
        title,
        body: body.replace(/\\n/g, '\n'),
        priority,
        targetAudience: 'all',
        publishDate: now,
        expiryDate: expiry,
        isActive: true,
        createdAt: now,
      });

      console.log('✅ Announcement published!');
    } else {
      console.log('Cancelled.');
    }

    rl.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
