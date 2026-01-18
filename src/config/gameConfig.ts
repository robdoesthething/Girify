import { FEEDBACK, GAME, REWARDS } from './constants';

export const calculateScore = (
  timeElapsed: number,
  isCorrect: boolean,
  hintsUsed: number
): number => {
  if (!isCorrect) {
    return 0;
  }

  let score = GAME.POINTS.CORRECT_BASE;

  // Time bonus: faster = more points (decays linearly)
  // Under TIME_BONUS_THRESHOLD: full bonus (900 pts)
  // Over TIME_DECAY_RATE seconds: no bonus
  if (timeElapsed <= GAME.TIME_BONUS_THRESHOLD) {
    score += GAME.POINTS.TIME_BONUS_MAX;
  } else if (timeElapsed < GAME.TIME_DECAY_RATE) {
    const bonus = Math.round(
      GAME.POINTS.TIME_BONUS_MAX *
        (1 -
          (timeElapsed - GAME.TIME_BONUS_THRESHOLD) /
            (GAME.TIME_DECAY_RATE - GAME.TIME_BONUS_THRESHOLD))
    );
    score += Math.max(0, bonus);
  }

  // Hint penalty
  score -= hintsUsed * GAME.POINTS.HINT_PENALTY;

  return Math.max(0, Math.min(1000, score));
};

export const calculateStreakBonus = (streakDays: number): number => {
  return REWARDS.CHALLENGE_COMPLETE + streakDays * REWARDS.STREAK_BONUS_PER_DAY;
};

export const shouldPromptFeedback = (
  lastFeedbackTime: string | null | undefined,
  gamesPlayed: number = 10
): boolean => {
  if (gamesPlayed < FEEDBACK.MIN_GAMES_BEFORE_PROMPT) {
    return false;
  }

  const now = Date.now();
  const timeSinceLastPrompt = lastFeedbackTime ? now - parseInt(lastFeedbackTime, 10) : Infinity;

  return timeSinceLastPrompt > FEEDBACK.PROMPT_INTERVAL && Math.random() < FEEDBACK.PROMPT_CHANCE;
};
