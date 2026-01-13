/**
 * Utility to publish activity events to friend feed
 */
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const ACTIVITY_COLLECTION = 'activityFeed';

/**
 * Publish an activity for friend feeds
 * @param {string} username - The user performing the action
 * @param {string} type - Activity type from ACTIVITY_TYPES
 * @param {Object} data - Additional data for the activity
 */
export const publishActivity = async (username, type, data = {}) => {
  if (!username || !type) {
    return;
  }

  try {
    const activityRef = collection(db, ACTIVITY_COLLECTION);
    await addDoc(activityRef, {
      username,
      type,
      ...data,
      timestamp: Timestamp.now(),
    });
    // eslint-disable-next-line no-console
    console.log(`[Activity] Published ${type} for ${username}`);
  } catch (e) {
    console.error('[Activity] Error publishing activity:', e);
  }
};

/**
 * Publish cosmetic purchase activity
 * @param {string} username
 * @param {string} itemId
 * @param {string} itemName
 * @param {string} itemType - 'badge', 'frame', 'title', etc.
 */
export const publishCosmeticPurchase = async (username, itemId, itemName, itemType) => {
  return publishActivity(username, 'cosmetic_purchased', {
    itemId,
    itemName,
    itemType,
  });
};
