import { useCallback, useRef, useState } from 'react';
import { Announcement, getUnreadAnnouncements, markAnnouncementAsRead } from '../utils/social/news';

interface UseAnnouncementsReturn {
  pendingAnnouncement: Announcement | null;
  dismissAnnouncement: () => Promise<void>;
  checkAnnouncements: () => Promise<void>;
}

/**
 * Hook for managing announcement display and read state
 * @param username - Current user's username
 * @returns { pendingAnnouncement, dismissAnnouncement, checkAnnouncements }
 */
export const useAnnouncements = (username: string): UseAnnouncementsReturn => {
  const [pendingAnnouncement, setPendingAnnouncement] = useState<Announcement | null>(null);
  // Track dismissed IDs in this session so they never re-show even if the DB
  // mark-as-read is slow or fails.
  const dismissedIds = useRef<Set<string>>(new Set());

  /**
   * Check for and display unread announcements
   */
  const checkAnnouncements = useCallback(async () => {
    if (!username) {
      return;
    }

    try {
      const unread = await getUnreadAnnouncements(username);
      if (unread && unread.length > 0) {
        // Skip announcements already dismissed this session
        const firstNew = unread.find(a => !dismissedIds.current.has(a.id));
        if (firstNew) {
          setPendingAnnouncement(firstNew);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  }, [username]);

  /**
   * Dismiss and mark current announcement as read
   */
  const dismissAnnouncement = useCallback(async () => {
    const current = pendingAnnouncement;
    if (!current || !username) {
      setPendingAnnouncement(null);
      return;
    }

    // Mark locally dismissed immediately so it never re-shows this session
    dismissedIds.current.add(current.id);
    setPendingAnnouncement(null);

    // Persist to DB in background
    try {
      await markAnnouncementAsRead(username, current.id);
    } catch (err) {
      console.warn('Failed to mark announcement read:', err);
    }
  }, [username, pendingAnnouncement]);

  return { pendingAnnouncement, dismissAnnouncement, checkAnnouncements };
};

export default useAnnouncements;
