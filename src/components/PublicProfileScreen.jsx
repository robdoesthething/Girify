import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile } from '../utils/social';
import {
  sendFriendRequest,
  getFriendshipStatus,
  blockUser,
  getBlockStatus,
} from '../utils/friends';
import TopBar from './TopBar';

const PublicProfileScreen = ({ currentUser }) => {
  const { theme } = useTheme();
  const { username: encodedUsername } = useParams();
  const username = decodeURIComponent(encodedUsername || '');
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none' | 'pending' | 'friends'
  const [isBlocked, setIsBlocked] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserProfile(username);
        if (data) {
          setProfile(data);
        } else {
          // Create a basic profile fallback
          setProfile({
            username,
            gamesPlayed: 0,
            bestScore: 0,
            friendCount: 0,
          });
        }

        if (currentUser && currentUser !== username) {
          const [status, blocked] = await Promise.all([
            getFriendshipStatus(currentUser, username),
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
        // Fallback even on error
        setProfile({
          username,
          gamesPlayed: 0,
          bestScore: 0,
          friendCount: 0,
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
    if (!currentUser || sendingRequest) return;
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
    if (!currentUser || blocking) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Block ${username}? They won't be able to send you friend requests.`
    );
    if (!confirmed) return;

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

  const initial = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
           ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}
      `}
    >
      <TopBar onOpenPage={page => navigate(page ? `/${page}` : '/')} />

      <div className="flex-1 overflow-y-auto w-full px-4 py-8">
        <div className="max-w-md mx-auto w-full">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div
            className={`rounded-3xl shadow-xl overflow-hidden border
                        ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}
                    `}
          >
            {/* Header */}
            <div
              className={`p-8 flex flex-col items-center border-b relative ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-lg mb-4 ring-4 ring-white dark:ring-slate-700">
                {initial}
              </div>
              <h2 className="text-2xl font-black tracking-tight">{username}</h2>
            </div>

            {/* Content */}
            <div className="p-8">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              ) : profile ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-3xl font-black text-slate-700 dark:text-slate-200">
                        {profile.gamesPlayed !== undefined ? profile.gamesPlayed : 0}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                        Games
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-3xl font-black text-emerald-500">
                        {profile.bestScore !== undefined ? profile.bestScore : 0}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                        Best
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-3xl font-black text-sky-500">
                        {profile.friendCount !== undefined ? profile.friendCount : 0}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                        Friends
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {currentUser && currentUser !== username && (
                    <div className="space-y-4">
                      {/* Friend Button */}
                      {!isBlocked &&
                        (friendStatus === 'friends' ? (
                          <div className="w-full py-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold">
                            ✅ Friends
                          </div>
                        ) : friendStatus === 'pending' || requestSent ? (
                          <div className="w-full py-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl text-center font-bold">
                            ⏳ Request Pending
                          </div>
                        ) : (
                          <button
                            onClick={handleAddFriend}
                            disabled={sendingRequest}
                            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
                          >
                            {sendingRequest ? 'Sending...' : '👋 Add Friend'}
                          </button>
                        ))}

                      {/* Block Button */}
                      {isBlocked ? (
                        <div className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-bold">
                          🚫 Blocked
                        </div>
                      ) : (
                        <button
                          onClick={handleBlock}
                          disabled={blocking}
                          className={`w-full py-3 rounded-xl text-sm font-bold transition-all
                                      ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}
                                  `}
                        >
                          {blocking ? 'Blocking...' : '🚫 Block User'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 opacity-50">
                  <p>{error || 'Profile not found'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileScreen;
