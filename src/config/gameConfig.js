import { GAME, REWARDS, FEEDBACK } from './constants';

export const calculateScore = (timeElapsed, isCorrect, hintsUsed) => {
  if (!isCorrect) return 0;

  let score = GAME.POINTS.CORRECT_BASE;

  // Time bonus (faster = more points)
  if (timeElapsed < GAME.TIME_BONUS_THRESHOLD) {
    const timeBonus = Math.floor(
      GAME.POINTS.TIME_BONUS_MAX * (1 - timeElapsed / GAME.TIME_BONUS_THRESHOLD)
    );
    score += timeBonus;
  }

  // Hint penalty
  score -= hintsUsed * GAME.POINTS.HINT_PENALTY;

  return Math.max(0, score);
};

export const calculateStreakBonus = streakDays => {
  return REWARDS.CHALLENGE_COMPLETE + streakDays * REWARDS.STREAK_BONUS_PER_DAY;
};

export const shouldPromptFeedback = (lastFeedbackTime, gamesPlayed = 10) => {
  if (gamesPlayed < FEEDBACK.MIN_GAMES_BEFORE_PROMPT) {
    return false;
  }

  const now = Date.now();
  const timeSinceLastPrompt = lastFeedbackTime ? now - parseInt(lastFeedbackTime) : Infinity;

  return timeSinceLastPrompt > FEEDBACK.PROMPT_INTERVAL && Math.random() < FEEDBACK.PROMPT_CHANCE;
};
