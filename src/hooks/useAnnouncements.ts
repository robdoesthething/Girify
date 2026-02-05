import { useCallback, useState } from 'react';
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
        // Show the most recent unread announcement
        setPendingAnnouncement(unread[0]!);
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  }, [username]);

  /**
   * Dismiss and mark current announcement as read
   */
  const dismissAnnouncement = useCallback(async () => {
    setPendingAnnouncement(prev => {
      if (prev && username) {
        markAnnouncementAsRead(username, prev.id).catch(err =>
          console.warn('Failed to mark announcement read:', err)
        );
      }
      return null;
    });
  }, [username]);

  return { pendingAnnouncement, dismissAnnouncement, checkAnnouncements };
};

export default useAnnouncements;
