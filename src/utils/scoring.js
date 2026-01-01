// Time-based scoring utility

/**
 * Calculate score based on time taken and hints used
 * @param {number} timeInSeconds - Time taken to answer
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {number} hintsCount - Number of hints revealed (0-3)
 * @returns {number} - Points earned (0-100)
 */
export function calculateTimeScore(timeInSeconds, isCorrect, hintsCount = 0) {
    if (!isCorrect) return 0;

    let basePoints = 0;
    if (timeInSeconds < 5) {
        basePoints = 100;
    } else if (timeInSeconds > 25) {
        basePoints = 20;
    } else {
        // Linear reduction from 100 to 20 over the range 5 to 25.
        // Slope = (20 - 100) / (25 - 5) = -80 / 20 = -4 points per second
        // Formula: 100 - 4 * (time - 5)
        basePoints = Math.round(100 - 4 * (timeInSeconds - 5));
    }

    // No hint penalty per user request
    return basePoints;
}

/**
 * Get score tier label
 * @param {number} points - Points earned
 * @returns {string} - Tier label
 */
export function getScoreTier(points) {
    if (points >= 90) return 'Perfect!';
    if (points >= 75) return 'Excellent';
    if (points >= 50) return 'Good';
    if (points >= 30) return 'Fair';
    if (points > 0) return 'Slow';
    return 'Wrong';
}

/**
 * Get score tier color
 * @param {number} points - Points earned
 * @returns {string} - Tailwind color class
 */
export function getScoreTierColor(points) {
    if (points >= 90) return 'text-emerald-500';
    if (points >= 75) return 'text-green-500';
    if (points >= 50) return 'text-yellow-500';
    if (points >= 30) return 'text-orange-500';
    if (points > 0) return 'text-red-500';
    return 'text-rose-500';
}
