import { useCallback, useRef, useState } from 'react';
import { Announcement, getUnreadAnnouncements, markAnnouncementAsRead } from '../utils/social/news';

const LS_KEY = 'girify_read_announcements';

function getLocallyReadIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as number[];
  } catch {
    return [];
  }
}

function saveLocallyReadId(id: string): void {
  try {
    const ids = getLocallyReadIds();
    const num = parseInt(id, 10);
    if (!ids.includes(num)) {
      localStorage.setItem(LS_KEY, JSON.stringify([...ids, num]));
    }
  } catch {
    // localStorage unavailable — skip
  }
}

interface UseAnnouncementsReturn {
  pendingAnnouncement: Announcement | null;
  dismissAnnouncement: () => Promise<void>;
  checkAnnouncements: () => Promise<void>;
}

export const useAnnouncements = (username: string): UseAnnouncementsReturn => {
  const [pendingAnnouncement, setPendingAnnouncement] = useState<Announcement | null>(null);
  const dismissedIds = useRef<Set<string>>(new Set());

  const checkAnnouncements = useCallback(async () => {
    if (!username) {
      return;
    }

    try {
      const unread = await getUnreadAnnouncements(username);
      if (!unread || unread.length === 0) {
        return;
      }

      const localRead = getLocallyReadIds();
      const firstNew = unread.find(
        a => !dismissedIds.current.has(a.id) && !localRead.includes(parseInt(a.id, 10))
      );
      if (firstNew) {
        setPendingAnnouncement(firstNew);
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  }, [username]);

  const dismissAnnouncement = useCallback(async () => {
    const current = pendingAnnouncement;
    if (!current || !username) {
      setPendingAnnouncement(null);
      return;
    }

    dismissedIds.current.add(current.id);
    saveLocallyReadId(current.id);
    setPendingAnnouncement(null);

    try {
      await markAnnouncementAsRead(username, current.id);
    } catch (err) {
      console.warn('Failed to mark announcement read:', err);
    }
  }, [username, pendingAnnouncement]);

  return { pendingAnnouncement, dismissAnnouncement, checkAnnouncements };
};

export default useAnnouncements;
