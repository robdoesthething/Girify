/**
 * Date Utilities
 *
 * Centralized logic for date manipulation, ensuring consistent UTC handling across the app.
 */

/**
 * Returns the ISO string for the start of the current day in UTC.
 * @param date Optional date object (defaults to now)
 */
export const getUTCStartOfDay = (date: Date = new Date()): string => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  ).toISOString();
};

/**
 * Returns the ISO string for the start of the current week (Monday) in UTC.
 * @param date Optional date object (defaults to now)
 */
import { DATE } from './constants';

// ...

export const getUTCStartOfWeek = (date: Date = new Date()): string => {
  const currentDayUTC = date.getUTCDay(); // 0 = Sunday
  const distanceToMonday =
    currentDayUTC === DATE.SUNDAY_INDEX ? DATE.SATURDAY_INDEX : currentDayUTC - 1;
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - distanceToMonday,
      0,
      0,
      0,
      0
    )
  ).toISOString();
};

/**
 * Returns the ISO string for the start of the current month in UTC.
 * @param date Optional date object (defaults to now)
 */
export const getUTCStartOfMonth = (date: Date = new Date()): string => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
};
