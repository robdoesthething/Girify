/**
 * Utility to publish activity events to friend feed
 */
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ActivityType } from '../data/activityTypes';
import { db } from '../firebase';

const ACTIVITY_COLLECTION = 'activityFeed';

interface ActivityData {
  [key: string]: unknown;
}

/**
 * Publish an activity for friend feeds
 * @param username - The user performing the action
 * @param type - Activity type from ACTIVITY_TYPES
 * @param data - Additional data for the activity
 */
export const publishActivity = async (
  username: string,
  type: ActivityType | string,
  data: ActivityData = {}
): Promise<void> => {
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

    console.warn(`[Activity] Published ${type} for ${username}`);
  } catch (e) {
    console.error('[Activity] Error publishing activity:', e);
  }
};

/**
 * Publish cosmetic purchase activity
 */
export const publishCosmeticPurchase = async (
  username: string,
  itemId: string,
  itemName: string,
  itemType: string
): Promise<void> => {
  return publishActivity(username, 'cosmetic_purchased', {
    itemId,
    itemName,
    itemType,
  });
};
