/**
 * News/Announcements Utility Functions
 * Handles creating, fetching, and tracking read status of announcements
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const USER_READ_COLLECTION = 'userReadAnnouncements';

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

/**
 * Get all announcements (for admin panel)
 */
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const q = query(announcementsRef, orderBy('publishDate', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Announcement[];
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
    const now = new Date();
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const q = query(
      announcementsRef,
      where('publishDate', '<=', Timestamp.fromDate(now)),
      orderBy('publishDate', 'desc')
    );
    const snapshot = await getDocs(q);

    return (
      snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Announcement[]
    ).filter(a => {
      // Filter out expired announcements
      if (a.expiryDate) {
        const expiry =
          typeof (a.expiryDate as { toDate?: () => Date }).toDate === 'function'
            ? (a.expiryDate as { toDate: () => Date }).toDate()
            : new Date(a.expiryDate as unknown as string);
        return expiry > now;
      }
      return true;
    });
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

    // Get user's read announcements
    const userReadRef = doc(db, USER_READ_COLLECTION, username);
    const userReadDoc = await getDoc(userReadRef);
    const data = userReadDoc.exists() ? (userReadDoc.data() as DocumentData) : {};
    const readIds: string[] = data.readIds || [];

    return active.filter(a => !readIds.includes(a.id));
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
    const userReadRef = doc(db, USER_READ_COLLECTION, username);
    const userReadDoc = await getDoc(userReadRef);

    if (userReadDoc.exists()) {
      const data = userReadDoc.data() as DocumentData;
      const readIds: string[] = data.readIds || [];
      if (!readIds.includes(announcementId)) {
        await updateDoc(userReadRef, {
          readIds: [...readIds, announcementId],
          lastRead: Timestamp.now(),
        });
      }
    } else {
      await setDoc(userReadRef, {
        readIds: [announcementId],
        lastRead: Timestamp.now(),
      });
    }
  } catch (e) {
    console.error('[News] Error marking as read:', e);
  }
};

const toTimestamp = (date: Date | string | null | undefined): Timestamp | null => {
  if (!date) {
    return null;
  }
  return date instanceof Date ? Timestamp.fromDate(date) : Timestamp.fromDate(new Date(date));
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

    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const docRef = await addDoc(announcementsRef, {
      title,
      body,
      publishDate: toTimestamp(publishDate as Date | string),
      expiryDate: toTimestamp(expiryDate as Date | string | null),
      isActive,
      priority,
      targetAudience,
      createdAt: Timestamp.now(),
    });

    return { success: true, id: docRef.id };
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
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);

    // Convert dates if needed
    const updatedData: Record<string, unknown> = { ...updates };
    if (updates.publishDate) {
      updatedData.publishDate = toTimestamp(updates.publishDate as Date | string);
    }
    if (updates.expiryDate) {
      updatedData.expiryDate = toTimestamp(updates.expiryDate as Date | string);
    }

    await updateDoc(announcementRef, updatedData);
    return { success: true };
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
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await deleteDoc(announcementRef);
    return { success: true };
  } catch (e) {
    console.error('[News] Error deleting announcement:', e);
    return { success: false, error: (e as Error).message };
  }
};
