import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  searchUsers,
  sendFriendRequest,
  getIncomingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getFriendFeed,
  removeFriend,
  blockUser,
} from '../utils/friends';
import { ACTIVITY_TYPES } from '../data/activityTypes';
// PublicProfileModal removed
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = [
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
  '🐧',
  '🐦',
  '🦆',
  '🦅',
];

const FriendsScreen = ({ onClose, username }) => {
  const navigate = useNavigate();
  const { theme, t } = useTheme();
  const [activeTab, setActiveTab] = useState('feed');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addMessage, setAddMessage] = useState(null);
  const [successfulRequests, setSuccessfulRequests] = useState(new Set());
  // selectedUser state removed as we navigate
  const [activeMenu, setActiveMenu] = useState(null); // username of active menu

  // Load initial data
  useEffect(() => {
    if (activeTab === 'friends') loadFriends();
    if (activeTab === 'requests') loadRequests();
    if (activeTab === 'feed') loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  const loadFriends = async () => {
    setLoading(true);
    const list = await getFriends(username);
    setFriends(list);
    setLoading(false);
  };

  const loadRequests = async () => {
    setLoading(true);
    const list = await getIncomingRequests(username);
    setRequests(list);
    setLoading(false);
  };

  const loadFeed = async () => {
    setLoading(true);
    const list = await getFriends(username); // Need friends to get feed
    const activity = await getFriendFeed(list);
    setFeed(activity);
    setLoading(false);
  };

  const handleSearch = async e => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearching(true);
    const results = await searchUsers(searchQuery);
    // Filter out myself
    setSearchResults(results.filter(r => r.username !== username));
    setSearching(false);
  };

  const handleSendRequest = async targetUser => {
    setAddMessage(`Sending request to ${targetUser}...`);
    const res = await sendFriendRequest(username, targetUser);
    if (res.success) {
      setAddMessage(`Request sent to ${targetUser}!`);
      setSuccessfulRequests(prev => new Set(prev).add(targetUser));
    } else {
      setAddMessage(`Error: ${res.error}`);
    }
    // Clear message after 3s
    setTimeout(() => setAddMessage(null), 3000);
  };

  const handleAccept = async requester => {
    await acceptFriendRequest(username, requester);
    loadRequests(); // Reload
  };

  const handleDecline = async requester => {
    await declineFriendRequest(username, requester);
    loadRequests(); // Reload
  };

  const handleRemoveFriend = async friendName => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Are you sure you want to remove ${friendName}?`)) return;
    await removeFriend(username, friendName);
    loadFriends(); // Reload list
    loadFeed(); // Reload feed as it might change
  };

  const handleBlockUser = async friendName => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Are you sure you want to block ${friendName}?`)) return;
    await blockUser(username, friendName);
    // Also remove from friends if blocked
    await removeFriend(username, friendName);
    loadFriends();
    loadFeed();
  };

  const tabClass =
    tab => `flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2
    ${
      activeTab === tab
        ? 'border-sky-500 text-sky-500'
        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
    }`;

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto backdrop-blur-md 
        ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center max-w-2xl mx-auto w-full mb-6 shrink-0">
        <h2 className="text-3xl font-black tracking-tight">Friends</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto w-full flex mb-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button onClick={() => setActiveTab('feed')} className={tabClass('feed')}>
          Feed
        </button>
        <button onClick={() => setActiveTab('friends')} className={tabClass('friends')}>
          Friends
        </button>
        <button onClick={() => setActiveTab('requests')} className={tabClass('requests')}>
          Requests{' '}
          {requests.length > 0 && (
            <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-8">
        {/* ADD FRIEND FORM (Visible in Friends tab) */}
        {activeTab === 'friends' && (
          <div className="mb-8 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-3">Add Friend</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search username..."
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-sm"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2 bg-sky-500 text-white font-bold rounded-lg text-sm"
              >
                {searching ? '...' : 'Search'}
              </button>
            </form>

            {addMessage && <p className="text-sm mt-2 text-emerald-500 font-bold">{addMessage}</p>}

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map(u => (
                  <div
                    key={u.username}
                    className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded"
                  >
                    <span className="font-bold">{u.username}</span>
                    <button
                      onClick={() => handleSendRequest(u.username)}
                      disabled={successfulRequests.has(u.username)}
                      className={`text-xs px-3 py-1 rounded transition-colors font-bold
                          ${
                            successfulRequests.has(u.username)
                              ? 'bg-emerald-500 text-white cursor-default'
                              : 'bg-slate-200 dark:bg-slate-700 hover:bg-sky-500 hover:text-white'
                          }
                        `}
                    >
                      {successfulRequests.has(u.username) ? 'Sent' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-10 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        )}

        {!loading && activeTab === 'feed' && (
          <div className="space-y-4">
            {feed.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p>No recent activity from friends.</p>
                <button
                  onClick={() => setActiveTab('friends')}
                  className="text-sky-500 font-bold mt-2 hover:underline"
                >
                  Add some friends!
                </button>
              </div>
            ) : (
              feed.map(item => {
                if (item.type === ACTIVITY_TYPES.USERNAME_CHANGED) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/30 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-black text-lg text-amber-500">
                            {item.oldUsername}
                          </span>
                          <span className="text-slate-500 text-sm ml-2">{t('changedNameTo')}</span>
                          <span className="font-black text-lg text-amber-500 ml-2">
                            {item.username}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {item.timestamp?.seconds
                            ? new Date(item.timestamp.seconds * 1000).toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (item.type === ACTIVITY_TYPES.BADGE_EARNED) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/30 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-black text-lg text-purple-500">
                            {item.username}
                          </span>
                          <span className="text-slate-500 text-sm ml-2">{t('badgeEarned')}</span>
                          {item.badge && (
                            <span className="ml-2 text-xl" title={item.badge.name}>
                              {item.badge.emoji}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {item.timestamp?.seconds
                            ? new Date(item.timestamp.seconds * 1000).toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Default: Score
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-baseline flex-wrap">
                        <span className="font-black text-lg text-sky-500 mr-2">
                          {item.username}
                        </span>
                        <span className="text-slate-500 text-sm">
                          {t('scored')} <strong>{item.score}</strong> {t('points')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                        {item.timestamp?.seconds
                          ? new Date(item.timestamp.seconds * 1000).toLocaleDateString()
                          : 'Just now'}
                      </span>
                    </div>
                    {item.time && (
                      <div className="text-xs text-slate-500 font-mono">
                        {t('avgTime')}: {item.time}s
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {!loading && activeTab === 'friends' && (
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-2">
              My Friends ({friends.length})
            </h3>
            {friends.map(f => (
              <div
                key={f.username}
                className="p-3 rounded-lg border flex justify-between items-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors relative"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br from-sky-400 to-indigo-600 border-2 border-white dark:border-slate-800 shadow-sm`}
                  >
                    {AVATARS[f.avatarId ? f.avatarId - 1 : 0] || '🐼'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{f.username}</h4>
                    {f.badges && f.badges.length > 0 && (
                      <span className="text-xs mr-2" title="Equipped Badge">
                        {/* Assuming badges are objects or emojis string */}
                        {typeof f.badges[0] === 'string' ? f.badges[0] : '🏅'}
                      </span>
                    )}
                    {f.todayGames > 0 && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                        Played Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Button */}
                <div className="relative">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === f.username ? null : f.username);
                    }}
                    className="p-2 ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {activeMenu === f.username && (
                    <>
                      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenu(null);
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/user/${encodeURIComponent(f.username)}`);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          👤 Profile
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveFriend(f.username);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 flex items-center gap-2"
                        >
                          Unfriend
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleBlockUser(f.username);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 flex items-center gap-2"
                        >
                          🚫 Block
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Modal Removed */}

        {!loading && activeTab === 'requests' && (
          <div className="space-y-2">
            {requests.length === 0 ? (
              <p className="text-center py-10 opacity-50">No pending requests.</p>
            ) : (
              requests.map(req => (
                <div
                  key={req.id}
                  className="p-3 rounded-lg border flex justify-between items-center bg-white dark:bg-slate-900 border-sky-500/30 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{req.from}</span>
                    <span className="text-xs text-slate-500">wants to be friends</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecline(req.from)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded text-xs font-bold"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleAccept(req.from)}
                      className="px-3 py-1 bg-sky-500 text-white rounded text-xs font-bold"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsScreen;
