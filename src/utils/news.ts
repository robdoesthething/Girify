/**
 * News/Announcements Utility Functions
 */
import { Timestamp } from 'firebase/firestore'; // Keep for compatibility if needed, but try to move away
import {
  createAnnouncement as dbCreateAnnouncement,
  deleteAnnouncement as dbDeleteAnnouncement,
  getActiveAnnouncements as dbGetActiveAnnouncements,
  getAllAnnouncements as dbGetAllAnnouncements,
  markAnnouncementAsRead as dbMarkAnnouncementAsRead,
  updateAnnouncement as dbUpdateAnnouncement,
  getReadAnnouncementIds,
} from '../services/database';
import { AnnouncementRow } from '../types/supabase';

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TargetAudience = 'all' | 'new_users' | 'returning';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishDate: Timestamp | Date | { seconds: number; toDate?: () => Date };
  expiryDate?: Timestamp | Date | { seconds: number; toDate?: () => Date } | null;
  isActive?: boolean;
  priority?: AnnouncementPriority;
  targetAudience?: TargetAudience;
  createdAt?: Timestamp;
}

interface AnnouncementInput {
  title: string;
  body: string;
  publishDate: Date | string;
  expiryDate?: Date | string | null;
  isActive?: boolean;
  priority?: AnnouncementPriority;
  targetAudience?: TargetAudience;
}

interface OperationResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Helper to convert DB Row to App Interface
const mapRowToAnnouncement = (row: AnnouncementRow): Announcement => {
  return {
    id: row.id.toString(),
    title: row.title,
    body: row.body,
    // Mock Timestamp-like object for compatibility
    publishDate: {
      seconds: new Date(row.publish_date).getTime() / 1000,
      toDate: () => new Date(row.publish_date),
    },
    expiryDate: row.expiry_date
      ? {
          seconds: new Date(row.expiry_date).getTime() / 1000,
          toDate: () => new Date(row.expiry_date!),
        }
      : null,
    isActive: row.is_active,
    priority: row.priority,
    targetAudience: row.target_audience,
    createdAt: {
      seconds: new Date(row.created_at).getTime() / 1000,
      toDate: () => new Date(row.created_at),
    } as Timestamp,
  };
};

/**
 * Get all announcements (for admin panel)
 */
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const rows = await dbGetAllAnnouncements();
    return rows.map(mapRowToAnnouncement);
  } catch (e) {
    console.error('[News] Error fetching announcements:', e);
    return [];
  }
};

/**
 * Get active announcements (published and not expired)
 */
export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const rows = await dbGetActiveAnnouncements();
    return rows.map(mapRowToAnnouncement);
  } catch (e) {
    console.error('[News] Error fetching active announcements:', e);
    return [];
  }
};

/**
 * Get unread announcements for a user
 */
export const getUnreadAnnouncements = async (username: string): Promise<Announcement[]> => {
  if (!username) {
    return [];
  }

  try {
    const active = await getActiveAnnouncements();
    if (active.length === 0) {
      return [];
    }

    const readIds = await getReadAnnouncementIds(username);
    // Convert DB IDs (string/number mess) - DB is number, App uses string ID for announcements?
    // Wait, announcements table ID is serial/number.
    // mapRowToAnnouncement converts ID to string.

    return active.filter(a => !readIds.includes(parseInt(a.id, 10)));
  } catch (e) {
    console.error('[News] Error getting unread announcements:', e);
    return [];
  }
};

/**
 * Mark announcement as read for user
 */
export const markAnnouncementAsRead = async (
  username: string,
  announcementId: string
): Promise<void> => {
  if (!username || !announcementId) {
    return;
  }

  try {
    const numericId = parseInt(announcementId, 10);
    // Check if simplified check is enough or if we need to check existence first?
    // INSERT will fail if duplicate PKEY but user_read_announcements likely (username, announcement_id) PK.
    // database.ts implementation handles insert error (likely ignore).

    // Check local logic: "if !readIds.includes..."
    const readIds = await getReadAnnouncementIds(username);
    if (!readIds.includes(numericId)) {
      await dbMarkAnnouncementAsRead(username, numericId);
    }
  } catch (e) {
    console.error('[News] Error marking as read:', e);
  }
};

const toTimestamp = (date: Date | string | null | undefined): string | null => {
  if (!date) {
    return null;
  }
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
};

/**
 * Create a new announcement (admin only)
 */
export const createAnnouncement = async (
  announcement: AnnouncementInput
): Promise<OperationResult> => {
  try {
    const {
      title,
      body,
      publishDate,
      expiryDate,
      isActive = true,
      priority = 'normal',
      targetAudience = 'all',
    } = announcement;

    if (!title || !body || !publishDate) {
      return { success: false, error: 'Missing required fields' };
    }

    const row: Omit<AnnouncementRow, 'id' | 'created_at'> = {
      title,
      body,
      publish_date: toTimestamp(publishDate)!,
      expiry_date: toTimestamp(expiryDate),
      is_active: isActive,
      priority: priority,
      target_audience: targetAudience,
    };

    const id = await dbCreateAnnouncement(row);
    if (!id) {
      throw new Error('Failed to create');
    }

    return { success: true, id };
  } catch (e) {
    console.error('[News] Error creating announcement:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Update an announcement (admin only)
 */
export const updateAnnouncement = async (
  id: string,
  updates: Partial<AnnouncementInput>
): Promise<OperationResult> => {
  try {
    const numericId = parseInt(id, 10);
    const dbUpdates: Partial<AnnouncementRow> = {};
    if (updates.title) {
      dbUpdates.title = updates.title;
    }
    if (updates.body) {
      dbUpdates.body = updates.body;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }
    if (updates.priority) {
      dbUpdates.priority = updates.priority;
    }
    if (updates.targetAudience) {
      dbUpdates.target_audience = updates.targetAudience;
    }
    if (updates.publishDate) {
      dbUpdates.publish_date = toTimestamp(updates.publishDate)!;
    } // Force string
    if (updates.expiryDate) {
      dbUpdates.expiry_date = toTimestamp(updates.expiryDate);
    }

    const success = await dbUpdateAnnouncement(numericId, dbUpdates);
    if (success) {
      return { success: true };
    }
    return { success: false, error: 'Update failed' };
  } catch (e) {
    console.error('[News] Error updating announcement:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Delete an announcement (admin only)
 */
export const deleteAnnouncement = async (id: string): Promise<OperationResult> => {
  try {
    const numericId = parseInt(id, 10);
    const success = await dbDeleteAnnouncement(numericId);
    if (success) {
      return { success: true };
    }
    return { success: false, error: 'Delete failed' };
  } catch (e) {
    console.error('[News] Error deleting announcement:', e);
    return { success: false, error: (e as Error).message };
  }
};
