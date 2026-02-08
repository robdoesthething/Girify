import { useEffect, useState } from 'react';
import { getEquippedCosmetics } from '../../../utils/shop/giuros';
import { getUserGameHistory, getUserProfile, UserProfile } from '../../../utils/social';
import {
  blockUser,
  getBlockStatus,
  getFriendshipStatus,
  sendFriendRequest,
} from '../../../utils/social/friends';

interface UsePublicProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  friendStatus: 'none' | 'friends' | 'pending';
  isBlocked: boolean;
  sendingRequest: boolean;
  requestSent: boolean;
  blocking: boolean;
  error: string | null;
  equippedCosmetics: Record<string, string>;
  history: any[];
  handleAddFriend: () => Promise<void>;
  handleBlock: () => Promise<void>;
}

export const usePublicProfile = (
  username: string,
  currentUser?: string
): UsePublicProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'pending'>('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, cosmeticsData, historyData] = await Promise.all([
          getUserProfile(username),
          getEquippedCosmetics(username) as Promise<Record<string, string>>,
          getUserGameHistory(username),
        ]);

        if (data) {
          setProfile(data);
        } else {
          setProfile({
            username,
            uid: '', // Placeholder
            email: '',
            realName: '',
            streak: 0,
            totalScore: 0,
            lastPlayDate: '',
            joinedAt: new Date().toISOString(),
            gamesPlayed: 0,
            bestScore: 0,
            friendCount: 0,
            maxStreak: 0,
            avatarId: 0,
          });
        }
        setEquippedCosmetics(cosmeticsData || {});
        setHistory(historyData || []);

        if (currentUser && currentUser !== username) {
          const [status, blocked] = await Promise.all([
            getFriendshipStatus(currentUser, username) as Promise<'none' | 'friends' | 'pending'>,
            getBlockStatus(currentUser, username),
          ]);
          setFriendStatus(status);
          setIsBlocked(blocked);
          if (status === 'pending') {
            setRequestSent(true);
          }
        }
      } catch (e) {
        console.error('Error loading profile:', e);
        setError('Failed to load profile');
        setProfile({
          username,
          uid: '',
          email: '',
          realName: '',
          streak: 0,
          totalScore: 0,
          lastPlayDate: '',
          joinedAt: new Date().toISOString(),
          gamesPlayed: 0,
          bestScore: 0,
          friendCount: 0,
          maxStreak: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      loadProfile();
    }
  }, [username, currentUser]);

  const handleAddFriend = async () => {
    if (!currentUser || sendingRequest) {
      return;
    }
    setSendingRequest(true);
    try {
      await sendFriendRequest(currentUser, username);
      setRequestSent(true);
      setFriendStatus('pending');
    } catch (e) {
      console.error('Error sending friend request:', e);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || blocking) {
      return;
    }
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Block ${username}? They won't be able to send you friend requests.`
    );
    if (!confirmed) {
      return;
    }

    setBlocking(true);
    try {
      await blockUser(currentUser, username);
      setIsBlocked(true);
    } catch (e) {
      console.error('Error blocking user:', e);
    } finally {
      setBlocking(false);
    }
  };

  return {
    profile,
    loading,
    friendStatus,
    isBlocked,
    sendingRequest,
    requestSent,
    blocking,
    error,
    equippedCosmetics,
    history,
    handleAddFriend,
    handleBlock,
  };
};
