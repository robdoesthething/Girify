/**
 * Activity Feed Event Types
 */
export const ACTIVITY_TYPES = {
  DAILY_SCORE: 'daily_score',
  BADGE_EARNED: 'badge_earned',
  USERNAME_CHANGED: 'username_changed',
  COSMETIC_PURCHASED: 'cosmetic_purchased',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

export default ACTIVITY_TYPES;
