/**
 * Utility to publish activity events to friend feed
 */
import { publishActivity as dbPublishActivity } from '../../services/database';
import { getUserByUsername } from '../../services/db/users';
import { supabase } from '../../services/supabase';
import { ActivityFeedRow } from '../../types/supabase';
import { normalizeUsername } from '../format';

// Helper to map ActivityData to ActivityFeedRow columns
const mapToRow = (
  username: string,
  type: string,
  data: Record<string, unknown>
): Omit<ActivityFeedRow, 'id'> => {
  const row: Omit<ActivityFeedRow, 'id'> = {
    username,

    type: type as any, // Cast to specific union type if possible
    created_at: new Date().toISOString(),
    score: typeof data.score === 'number' ? data.score : null,
    time_taken: typeof data.time === 'number' ? data.time : null,
    badge_id: typeof data.badgeId === 'string' ? data.badgeId : null,
    badge_name: typeof data.badgeName === 'string' ? data.badgeName : null,
    old_username: typeof data.oldUsername === 'string' ? data.oldUsername : null,
    item_id: typeof data.itemId === 'string' ? data.itemId : null,
    item_name: typeof data.itemName === 'string' ? data.itemName : null,
    item_type: typeof data.itemType === 'string' ? data.itemType : null,
    metadata: {},
  };

  // Put everything else in metadata
  const explicitKeys = [
    'score',
    'time',
    'badgeId',
    'badgeName',
    'oldUsername',
    'itemId',
    'itemName',
    'itemType',
  ];

  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!explicitKeys.includes(key)) {
      metadata[key] = value;
    }
  }

  row.metadata = metadata as any;

  return row;
};

/**
 * Publish an activity for friend feeds
 * @param username - The user performing the action
 * @param type - Activity type
 * @param data - Additional data for the activity
 */
export const publishActivity = async (
  username: string,
  type: string,
  data: Record<string, unknown> = {}
): Promise<void> => {
  if (!username || !type) {
    return;
  }

  // Security: Verify user owns this username to prevent impersonation
  const normalizedUsername = normalizeUsername(username);
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    console.error('[Activity] Auth failed: no authenticated user');
    return;
  }

  // Verify the current user owns this username
  const userProfile = await getUserByUsername(normalizedUsername);
  if (!userProfile || (userProfile.supabase_uid && userProfile.supabase_uid !== currentUser.id)) {
    // Fallback: check by uid for users who haven't migrated supabase_uid yet
    if (!userProfile || userProfile.uid !== currentUser.id) {
      console.error('[Activity] Auth failed: user does not own username', {
        requested: normalizedUsername,
        currentUid: currentUser.id,
      });
      return;
    }
  }

  try {
    const row = mapToRow(normalizedUsername, type, data);
    await dbPublishActivity(row);
  } catch (e) {
    console.error('[Activity] Error publishing activity:', e);
  }
};

/**
 * Publish cosmetic purchase activity
 * @param username - The username who purchased
 * @param itemId - The item ID
 * @param itemName - The item name
 * @param itemType - The item type (frame, title, etc)
 * @returns Promise resolving when published
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
