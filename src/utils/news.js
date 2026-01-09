/**
 * News/Announcements Utility Functions
 * Handles creating, fetching, and tracking read status of announcements
 */
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const USER_READ_COLLECTION = 'userReadAnnouncements';

/**
 * Get all announcements (for admin panel)
 * @returns {Promise<Array>}
 */
export const getAllAnnouncements = async () => {
  try {
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const q = query(announcementsRef, orderBy('publishDate', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (e) {
    console.error('[News] Error fetching announcements:', e);
    return [];
  }
};

/**
 * Get active announcements (published and not expired)
 * @returns {Promise<Array>}
 */
export const getActiveAnnouncements = async () => {
  try {
    const now = new Date();
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const q = query(
      announcementsRef,
      where('publishDate', '<=', Timestamp.fromDate(now)),
      orderBy('publishDate', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(d => ({
        id: d.id,
        ...d.data(),
      }))
      .filter(a => {
        // Filter out expired announcements
        if (a.expiryDate) {
          const expiry = a.expiryDate.toDate ? a.expiryDate.toDate() : new Date(a.expiryDate);
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
 * @param {string} username
 * @returns {Promise<Array>}
 */
export const getUnreadAnnouncements = async username => {
  if (!username) return [];

  try {
    const active = await getActiveAnnouncements();
    if (active.length === 0) return [];

    // Get user's read announcements
    const userReadRef = doc(db, USER_READ_COLLECTION, username);
    const userReadDoc = await getDoc(userReadRef);
    const readIds = userReadDoc.exists() ? userReadDoc.data().readIds || [] : [];

    return active.filter(a => !readIds.includes(a.id));
  } catch (e) {
    console.error('[News] Error getting unread announcements:', e);
    return [];
  }
};

/**
 * Mark announcement as read for user
 * @param {string} username
 * @param {string} announcementId
 */
export const markAnnouncementAsRead = async (username, announcementId) => {
  if (!username || !announcementId) return;

  try {
    const userReadRef = doc(db, USER_READ_COLLECTION, username);
    const userReadDoc = await getDoc(userReadRef);

    if (userReadDoc.exists()) {
      const readIds = userReadDoc.data().readIds || [];
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

/**
 * Create a new announcement (admin only)
 * @param {Object} announcement - { title, body, publishDate, expiryDate? }
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createAnnouncement = async announcement => {
  try {
    const { title, body, publishDate, expiryDate } = announcement;

    if (!title || !body || !publishDate) {
      return { success: false, error: 'Missing required fields' };
    }

    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const docRef = await addDoc(announcementsRef, {
      title,
      body,
      publishDate:
        publishDate instanceof Date
          ? Timestamp.fromDate(publishDate)
          : Timestamp.fromDate(new Date(publishDate)),
      expiryDate: expiryDate
        ? expiryDate instanceof Date
          ? Timestamp.fromDate(expiryDate)
          : Timestamp.fromDate(new Date(expiryDate))
        : null,
      createdAt: Timestamp.now(),
    });

    return { success: true, id: docRef.id };
  } catch (e) {
    console.error('[News] Error creating announcement:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Update an announcement (admin only)
 * @param {string} id
 * @param {Object} updates
 */
export const updateAnnouncement = async (id, updates) => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);

    // Convert dates if needed
    const updatedData = { ...updates };
    if (updates.publishDate) {
      updatedData.publishDate =
        updates.publishDate instanceof Date
          ? Timestamp.fromDate(updates.publishDate)
          : Timestamp.fromDate(new Date(updates.publishDate));
    }
    if (updates.expiryDate) {
      updatedData.expiryDate =
        updates.expiryDate instanceof Date
          ? Timestamp.fromDate(updates.expiryDate)
          : Timestamp.fromDate(new Date(updates.expiryDate));
    }

    await updateDoc(announcementRef, updatedData);
    return { success: true };
  } catch (e) {
    console.error('[News] Error updating announcement:', e);
    return { success: false, error: e.message };
  }
};

/**
 * Delete an announcement (admin only)
 * @param {string} id
 */
export const deleteAnnouncement = async id => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await deleteDoc(announcementRef);
    return { success: true };
  } catch (e) {
    console.error('[News] Error deleting announcement:', e);
    return { success: false, error: e.message };
  }
};
