/**
 * Migration Script: Upload Static Achievements to Firestore
 * Run with: node scripts/migrateAchievements.js
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Static Achievements Data (Copied from src/data/achievements.ts)
const ACHIEVEMENT_BADGES = [
  // === SOCIAL ===
  {
    id: 'badge_gentrificador',
    image: '/badges/badge_gentrificador.png',
    name: 'The Gentrificador',
    description: 'You told 3 friends about the city. Now rent is going up 50%.',
    category: 'social',
    type: 'merit',
    criteria: { inviteCount: 3 },
    flavorText: 'Invite 3 friends',
  },
  {
    id: 'badge_tour_guide',
    image: '/badges/badge_tour_guide.png',
    name: 'Unofficial Guide',
    description: 'You are basically leading groups with an umbrella now.',
    category: 'social',
    type: 'merit',
    criteria: { inviteCount: 10 },
    flavorText: 'Invite 10 friends',
  },
  {
    id: 'badge_influencer',
    image: '/badges/badge_influencer.png',
    name: 'Barcelona Influencer',
    description: '"Check out this hidden gem!" (It is a Starbucks).',
    category: 'social',
    type: 'merit',
    criteria: { inviteCount: 25 },
    flavorText: 'Invite 25 friends',
  },

  // === STARTER (General Gameplay) ===
  {
    id: 'badge_first_game',
    image: '/badges/badge_first_game.png',
    name: 'Fresh Guiri',
    description: 'You just arrived. Careful with the Sangria, it is strong.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 1 },
  },
  {
    id: 'badge_explorer',
    image: '/badges/badge_explorer.png',
    name: 'Ramblas Survivor',
    description: 'You walked 5 times without buying a flying magnet. Impressive.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 5 },
  },
  {
    id: 'badge_scholar',
    image: '/badges/badge_scholar.png',
    name: 'Metro Master',
    description: 'You know that L1 is a sauna and L5 smells funny.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 10 },
  },
  {
    id: 'badge_veteran',
    image: '/badges/badge_veteran.png',
    name: 'Honorary Resident',
    description: 'You have started complaining about tourists. One of us.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 50 },
  },
  {
    id: 'badge_legend',
    image: '/badges/badge_legend.png',
    name: 'The Alcalde',
    description: 'You basically run this town. Next stop: city council.',
    category: 'starter',
    type: 'merit',
    criteria: { gamesPlayed: 100 },
  },
  {
    id: 'badge_streak_3',
    image: '/badges/badge_streak_3.png',
    name: 'Calçotada Season',
    description: "Things are heating up. Don't forget the bib.",
    category: 'starter',
    type: 'merit',
    criteria: { streak: 3 },
  },
  {
    id: 'badge_streak_7',
    image: '/badges/badge_streak_7.png',
    name: 'Festa Major',
    description: 'A full week of partying (playing). Your neighbors hate you.',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 7 },
  },
  {
    id: 'badge_streak_30',
    image: '/badges/badge_streak_30.png',
    name: 'Sagrada Família',
    description: 'Slow, steady, and taking forever to finish. A masterpiece.',
    category: 'starter',
    type: 'merit',
    criteria: { streak: 30 },
  },
  {
    id: 'badge_champion',
    image: '/badges/badge_champion.png',
    name: 'Tapa King',
    description: 'You ordered everything on the menu. A solid performance.',
    category: 'starter',
    type: 'merit',
    criteria: { bestScore: 1800 },
  },
  {
    id: 'badge_perfect',
    image: '/badges/badge_perfect.png',
    name: "Gaudí's Vision",
    description: 'Pure perfection. Not a single straight line in sight.',
    category: 'starter',
    type: 'merit',
    criteria: { bestScore: 2000 },
  },

  // === SPECIALS (Formerly complex categories, now Starter) ===
  {
    id: 'badge_gamba_roja',
    image: '/badges/badge_gamba_roja.png',
    name: 'The Gamba Roja',
    description: 'Forgot sunscreen? You blend in with the paella now.',
    category: 'starter',
    type: 'merit',
    criteria: { wrongStreak: 5 },
    flavorText: 'Get 5 wrong in a row',
  },
  {
    id: 'badge_night_owl',
    image: '/badges/badge_night_owl.png',
    name: 'Razzmatazz Zombie',
    description: 'Playing at 4AM? Go home, you have work tomorrow.',
    category: 'starter',
    type: 'merit',
    criteria: { nightPlay: true },
    flavorText: 'Play between 3AM and 6AM',
  },
  {
    id: 'badge_fast_loss',
    image: '/badges/badge_fast_loss.png',
    name: 'Pickpocketed',
    description: "Game over in 30 seconds. They took your phone, didn't they?",
    category: 'starter',
    type: 'merit',
    criteria: { fastLoss: true },
    flavorText: 'Lose within 30 seconds',
  },
  {
    id: 'badge_precision',
    image: '/badges/badge_precision.png',
    name: 'Human GPS',
    description: "You don't need Google Maps. You ARE Google Maps.",
    category: 'starter',
    type: 'merit',
    criteria: { precisionGuess: true },
    flavorText: 'Guess with <10m error',
  },

  // === SHOP ITEMS ===
  {
    id: 'badge_paellador',
    name: 'Paellador Fan',
    description: 'Neon yellow rice. Deliciously fake.',
    category: 'starter',
    type: 'shop',
    cost: 50,
    emoji: '🥘',
  },
  {
    id: 'badge_sangria_bucket',
    name: 'Sangria Bucket',
    description: '10 straws, 1 headache.',
    category: 'starter',
    type: 'shop',
    cost: 100,
    emoji: '🍷',
  },
  {
    id: 'badge_tcasual',
    name: 'T-Casual Hoarder',
    description: 'You have 15 of these in your wallet. None work.',
    category: 'starter',
    type: 'shop',
    cost: 200,
    emoji: '🎫',
  },
  {
    id: 'badge_pigeon',
    name: 'Plaza Cat',
    description: 'Owner of the plaza. Judge of tourists.',
    category: 'starter',
    type: 'shop',
    cost: 300,
    emoji: '🐈',
  },
  {
    id: 'badge_scooter',
    name: 'Electric Menace',
    description: 'Sidewalks are for the weak. Speed is key.',
    category: 'starter',
    type: 'shop',
    cost: 500,
    emoji: '🛴',
  },
  {
    id: 'badge_yacht',
    name: 'Yacht Parking',
    description: 'For when the port is too small for your ego.',
    category: 'starter',
    type: 'shop',
    cost: 1000,
    emoji: '🛥️',
  },
];

async function migrateAchievements() {
  console.log('Starting migration of achievements...');
  const batch = db.batch();
  const collectionRef = db.collection('achievements');

  let count = 0;
  for (const badge of ACHIEVEMENT_BADGES) {
    const docRef = collectionRef.doc(badge.id);
    batch.set(docRef, badge);
    count++;
  }

  await batch.commit();
  console.log(`Successfully migrated ${count} achievements to Firestore.`);
}

migrateAchievements().catch(console.error);
