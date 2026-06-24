import { useEffect, useState } from 'react';
import { awardGiuros } from '../utils/shop/giuros';

const UPDATE_VERSION = 'v0.2';
const GIUROS_REWARD = 25;

function seenKey(username: string) {
  return `girify_update_${UPDATE_VERSION}_seen_${username}`;
}

interface UseUpdateModalReturn {
  showUpdateModal: boolean;
  giurosAwarded: number;
  dismissUpdateModal: () => void;
}

export function useUpdateModal(username: string): UseUpdateModalReturn {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [giurosAwarded, setGiurosAwarded] = useState(0);

  useEffect(() => {
    if (!username) {
      return () => {};
    }
    if (localStorage.getItem(seenKey(username))) {
      return () => {};
    }

    let cancelled = false;

    awardGiuros(username, GIUROS_REWARD).then(result => {
      if (cancelled) {
        return;
      }
      setGiurosAwarded(result.success ? GIUROS_REWARD : 0);
      setShowUpdateModal(true);
    });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const dismissUpdateModal = () => {
    setShowUpdateModal(false);
    if (username) {
      localStorage.setItem(seenKey(username), '1');
    }
  };

  return { showUpdateModal, giurosAwarded, dismissUpdateModal };
}
