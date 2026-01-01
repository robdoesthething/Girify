import { db } from '../firebase';
import { collection, doc, setDoc, addDoc, getDoc, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { getTodaySeed } from './dailyChallenge';

const HIGHSCORES_COLLECTION = 'highscores'; // Personal Bests (All Time)
const SCORES_COLLECTION = 'scores'; // Full History

/**
 * Save score to both:
 * 1. 'scores' collection (History for Daily/Weekly rankings)
 * 2. 'highscores' collection (Personal Best, if improved)
 */
export const saveScore = async (username, score, time) => {
    if (!username) {
        console.warn('[Leaderboard] saveScore called without username, skipping.');
        return;
    }

    console.log(`[Leaderboard] Saving score for ${username}: ${score} pts, ${time}s`);

    try {
        const now = Timestamp.now();
        const scoreData = {
            username,
            score,
            time: parseFloat(time),
            date: getTodaySeed(),
            timestamp: now,
            platform: 'web'
        };

        // 1. Add to History (Always)
        await addDoc(collection(db, SCORES_COLLECTION), scoreData);
        console.log('[Leaderboard] Score saved to history successfully');

        // 2. Check & Update Personal Best (All Time)
        const userDocRef = doc(db, HIGHSCORES_COLLECTION, username);
        const userDoc = await getDoc(userDocRef);
        let shouldUpdate = false;

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (score > data.score) {
                shouldUpdate = true;
            } else if (score === data.score && parseFloat(time) < parseFloat(data.time)) {
                shouldUpdate = true;
            }
        } else {
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            await setDoc(userDocRef, scoreData);
            console.log("[Leaderboard] New Personal Best saved!");
        }
    } catch (e) {
        console.error("Error saving score: ", e);
        console.error("[Leaderboard] Full error details:", e.code, e.message);
    }
};

/**
 * Get leaderboard with deduplication (One entry per user)
 * @param {string} period - 'all', 'daily', 'weekly', 'monthly'
 */
export const getLeaderboard = async (period = 'all') => {
    try {
        let scores = [];

        if (period === 'all') {
            // Efficient: Just query the Pre-Calculated Highscores
            const q = query(collection(db, HIGHSCORES_COLLECTION), orderBy("score", "desc"), limit(50));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => scores.push({ id: doc.id, ...doc.data() }));
        } else {
            // For periods, we query the history 'scores' collection
            // Optimally, we'd use composite indexes. For small apps, we verify filtering client/server mix.

            const scoresRef = collection(db, SCORES_COLLECTION);

            if (period === 'daily') {
                // Filter by today's seed
                const q = query(scoresRef, where("date", "==", getTodaySeed())); // Requires simple index (auto-created usually)
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => scores.push({ id: doc.id, ...doc.data() }));
            } else {
                // Weekly / Monthly: Fetch recent scores and filter
                // (Using a simple query limit to avoid fetching everything)
                const q = query(scoresRef, orderBy("timestamp", "desc"), limit(500));
                const snapshot = await getDocs(q);

                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data.timestamp.toDate();
                    if (period === 'weekly' && date > oneWeekAgo) scores.push({ id: doc.id, ...data });
                    if (period === 'monthly' && date > oneMonthAgo) scores.push({ id: doc.id, ...data });
                });
            }

            // Deduplicate: Keep best score per user
            scores = deduplicateScores(scores);
        }

        // Sort Final Result (Score DESC, Time ASC)
        scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time;
        });

        return scores.slice(0, 50); // Top 50
    } catch (e) {
        console.error("Error getting leaderboard: ", e);
        return [];
    }
};

const deduplicateScores = (scores) => {
    const userBest = {};
    scores.forEach(s => {
        if (!userBest[s.username]) {
            userBest[s.username] = s;
        } else {
            // Check if this new score is better
            const best = userBest[s.username];
            if (s.score > best.score || (s.score === best.score && s.time < best.time)) {
                userBest[s.username] = s;
            }
        }
    });
    return Object.values(userBest);
};
