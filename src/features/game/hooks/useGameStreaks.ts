import { useCallback } from 'react';
import { STORAGE_KEYS } from '../../../config/constants';
import { GameHistory } from '../../../types/user';
import { getTodaySeed } from '../../../utils/game/dailyChallenge';
import { awardChallengeBonus } from '../../../utils/shop/giuros';
import { updateUserGameStats } from '../../../utils/social';
import { calculateStreak } from '../../../utils/stats';
import { storage } from '../../../utils/storage';

export const useGameStreaks = () => {
  const updateStreaks = useCallback(async (username: string, score: number) => {
    if (!username) {
      return;
    }

    try {
      const historyForStreak = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
      const streak = calculateStreak(historyForStreak.map(h => ({ ...h, date: Number(h.date) })));
      const totalScore = historyForStreak.reduce(
        (acc: number, h: GameHistory) => acc + (h.score || 0),
        0
      );

      await updateUserGameStats(username, {
        streak,
        totalScore,
        lastPlayDate: String(getTodaySeed()),
        currentScore: score,
      });

      await awardChallengeBonus(username, streak);
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  }, []);

  return { updateStreaks };
};
