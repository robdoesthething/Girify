// Scripts to populate Firestore with mock news
// Run with: node scripts/populateMockNews.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
// Load env vars via shell or environment
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to check for required env vars - hardcode if needed for script or assume .env works
// For this script, we'll try to use the same logic as the app if possible, or just hardcode
// values if the user has them in .env.local which dotenv should load.

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Missing Firebase Config in environment variables.');
  console.log('Ensure .env.local exists in root with VITE_FIREBASE_* keys.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const NEWS_COLLECTION = 'announcements';

const MOCK_NEWS = [
  {
    title: 'Welcome to Girify! 🦒',
    body: `We are thrilled to launch <strong>Girify</strong>, your daily Barcelona street challenge!
    <br/><br/>
    Explore the city, guess the streets, and climb the leaderboard.
    Don't forget to invite your friends to earn extra <strong>Giuros</strong>!`,
    publishDate: Timestamp.now(), // Today
    expiryDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 days
    isActive: true,
    targetAudience: 'all',
  },
  {
    title: 'New Feature: Friends & Feed',
    body: `Connect with your friends! You can now search for users, add them as friends, and see their activity in your feed.
    <br/>
    Compete for the best daily score and show off your badges!`,
    publishDate: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    expiryDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    isActive: true,
    targetAudience: 'all',
  },
  {
    title: 'Shop Update: Balcony Grandma Badge 👵',
    body: `A new badge has landed in the shop!
    <br/><br/>
    <strong>The Balcony Grandma</strong> sees all. Equip it to show you are a true local observer.
    Check it out in the cosmetics store now.`,
    publishDate: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
    expiryDate: Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
    isActive: true,
    targetAudience: 'all',
  },
];

async function populate() {
  console.log('🚀 Populating mock news...');
  try {
    for (const news of MOCK_NEWS) {
      await addDoc(collection(db, NEWS_COLLECTION), news);
      console.log(`✅ Added: ${news.title}`);
    }
    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Error adding news:', error);
  }
  process.exit(0);
}

populate();
