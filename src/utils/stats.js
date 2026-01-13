/**
 * Calculate valid daily streak from game history.
 * Streak = Consecutive days of play up to today/yesterday.
 *
 * @param {Array<{date: number}>} history - List of game records
 * @returns {number} Current streak
 */
export const calculateStreak = history => {
  if (!history || history.length === 0) {
    return 0;
  }

  // Sort by date descending
  const sorted = [...history].sort((a, b) => b.date - a.date);

  // Get today's date seed (YYYYMMDD format)
  const today = new Date();
  const getSeed = d =>
    parseInt(
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`,
      10
    );

  const todaySeed = getSeed(today);

  // Calculate yesterday seed for grace period check
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaySeed = getSeed(yesterday);

  let streak = 0;
  const lastPlayed = sorted[0].date;

  // Streak should only be lost after a day has passed without completing.
  // If last played > yesterday, streak is broken.
  // But wait, lastPlayed is YYYYMMDD integer. So larger int means NEWER date.
  // If lastPlayed < yesterdaySeed, streak is broken.
  if (lastPlayed < yesterdaySeed) {
    return 0;
  }

  let expectedDate = lastPlayed === todaySeed ? todaySeed : yesterdaySeed;

  // Count backwards from expectedDate
  for (const record of sorted) {
    if (record.date === expectedDate) {
      streak++;
      // Move expected to previous day
      const YEAR_DIVISOR = 10000;
      const MONTH_DIVISOR = 100;
      const year = Math.floor(expectedDate / YEAR_DIVISOR);
      const month = Math.floor((expectedDate % YEAR_DIVISOR) / MONTH_DIVISOR);
      const day = expectedDate % MONTH_DIVISOR;
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() - 1);
      expectedDate = getSeed(d);
    } else if (record.date < expectedDate) {
      // Gap found
      break;
    }
  }

  return streak;
};
