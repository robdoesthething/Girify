import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { ACTIVITY_TYPES } from '../../../data/activityTypes';
import { getAvatar } from '../../../data/avatars';
import {
  acceptFriendRequest,
  blockUser,
  declineFriendRequest,
  getFriendFeed,
  getFriends,
  getIncomingRequests,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '../../../utils/friends';

interface FriendsScreenProps {
  onClose: () => void;
  username: string;
}

interface Friend {
  username: string;
  avatarId?: number;
  badges?: string[];
  todayGames?: number;
}

interface FeedItem {
  id: string;
  type: string;
  username: string;
  oldUsername?: string;
  badge?: { name: string; emoji: string };
  itemName?: string;
  score?: number;
  timestamp?: { seconds: number };
  avatarId?: number;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ onClose, username }) => {
  const navigate = useNavigate();
  const { theme, t } = useTheme();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'requests'>('feed');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [successfulRequests, setSuccessfulRequests] = useState(new Set<string>());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    }
    if (activeTab === 'requests') {
      loadRequests();
    }
    if (activeTab === 'feed') {
      loadFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  const loadFriends = async () => {
    setLoading(true);
    const list = (await getFriends(username)) as Friend[];
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
    const list = await getFriends(username);
    const activity = await getFriendFeed(list);
    setFeed(activity);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      return;
    }
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results.filter((r: { username: string }) => r.username !== username));
    setSearching(false);
  };

  const handleSendRequest = async (targetUser: string) => {
    setAddMessage(`Sending request to ${targetUser}...`);
    const res = await sendFriendRequest(username, targetUser);
    if (res.success) {
      setAddMessage(`Request sent to ${targetUser}!`);
      setSuccessfulRequests(prev => new Set(prev).add(targetUser));
    } else {
      setAddMessage(`Error: ${res.error}`);
    }
    setTimeout(() => setAddMessage(null), 3000);
  };

  const handleAccept = async (requester: string) => {
    await acceptFriendRequest(username, requester);
    loadRequests();
  };

  const handleDecline = async (requester: string) => {
    await declineFriendRequest(username, requester);
    loadRequests();
  };

  const handleRemoveFriend = async (friendName: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Are you sure you want to remove ${friendName}?`)) {
      return;
    }
    await removeFriend(username, friendName);
    loadFriends();
    loadFeed();
  };

  const handleBlockUser = async (friendName: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Are you sure you want to block ${friendName}?`)) {
      return;
    }
    await blockUser(username, friendName);
    await removeFriend(username, friendName);
    loadFriends();
    loadFeed();
  };

  const tabClass = (
    tab: string
  ) => `flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2
    ${
      activeTab === tab
        ? 'border-sky-500 text-sky-500'
        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
    }`;

  const UserLink: React.FC<{ name: string; avatar: string; children: ReactNode }> = ({
    name,
    avatar,
    children,
  }) => (
    <button
      onClick={() => navigate(`/user/${encodeURIComponent(name)}`)}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left group"
      type="button"
    >
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg border border-slate-300 dark:border-slate-600">
        {avatar}
      </div>
      <div>{children}</div>
    </button>
  );

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto backdrop-blur-md
        ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      <div className="flex justify-between items-center max-w-2xl mx-auto w-full mb-6 shrink-0">
        <h2 className="text-3xl font-black tracking-tight">Friends</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          type="button"
          aria-label={t('close')}
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

      <div className="max-w-2xl mx-auto w-full flex mb-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button onClick={() => setActiveTab('feed')} className={tabClass('feed')} type="button">
          Feed
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={tabClass('friends')}
          type="button"
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={tabClass('requests')}
          type="button"
        >
          Requests{' '}
          {requests.length > 0 && (
            <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full pb-8">
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
                aria-label="Search username"
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
                    <span className="font-bold">{u.username.toLowerCase()}</span>
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
                      type="button"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
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
                  type="button"
                >
                  Add some friends!
                </button>
              </div>
            ) : (
              feed.map(item => {
                // Use avatarId from feed item (already populated from friends data)
                // or fallback to looking up from friends list
                const avatar = getAvatar(
                  item.avatarId || friends.find(f => f.username === item.username)?.avatarId
                );

                if (item.type === ACTIVITY_TYPES.USERNAME_CHANGED) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/30 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="font-black text-lg text-amber-500 mb-1">
                            <UserLink name={item.username} avatar={avatar}>
                              <span>{item.username.toLowerCase()}</span>
                            </UserLink>
                          </span>
                          <span className="text-slate-500 text-sm ml-10">
                            {t('changedNameTo')}{' '}
                            <span className="font-bold">{item.oldUsername || '???'}</span>
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
                        <UserLink name={item.username} avatar={avatar}>
                          <div>
                            <span className="font-black text-lg text-purple-500 block leading-none">
                              {item.username.toLowerCase()}
                            </span>
                            <span className="text-slate-500 text-xs">{t('badgeEarned')}</span>
                          </div>
                        </UserLink>
                        {item.badge && (
                          <span className="text-2xl" title={item.badge.name}>
                            {item.badge.emoji}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 absolute top-4 right-4">
                          {item.timestamp?.seconds
                            ? new Date(item.timestamp.seconds * 1000).toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (item.type === ACTIVITY_TYPES.COSMETIC_PURCHASED) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-cyan-200 dark:border-cyan-900/30 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <UserLink name={item.username} avatar={avatar}>
                          <div>
                            <span className="font-black text-lg text-cyan-500 block leading-none">
                              {item.username.toLowerCase()}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {t('unlockedCosmetic') || 'unlocked'}{' '}
                              <span className="font-bold text-cyan-600">
                                {item.itemName?.replace(/_/g, ' ') || 'item'}
                              </span>
                            </span>
                          </div>
                        </UserLink>
                        <span className="text-xs text-slate-400">
                          {item.timestamp?.seconds
                            ? new Date(item.timestamp.seconds * 1000).toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <UserLink name={item.username} avatar={avatar}>
                          <div>
                            <span className="font-black text-lg text-sky-500 block leading-none">
                              {item.username.toLowerCase()}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {t('scored')} <strong>{item.score}</strong> {t('points')}
                            </span>
                          </div>
                        </UserLink>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                        {item.timestamp?.seconds
                          ? new Date(item.timestamp.seconds * 1000).toLocaleDateString()
                          : 'Just now'}
                      </span>
                    </div>
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br from-sky-400 to-indigo-600 border-2 border-white dark:border-slate-800 shadow-sm">
                    {getAvatar(f.avatarId)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{f.username.toLowerCase()}</h4>
                    {f.badges && f.badges.length > 0 && (
                      <span className="text-xs mr-2" title="Equipped Badge">
                        {typeof f.badges[0] === 'string' ? f.badges[0] : '🏅'}
                      </span>
                    )}
                    {f.todayGames && f.todayGames > 0 ? (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                        Played Today
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === f.username ? null : f.username);
                    }}
                    className="p-2 ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    type="button"
                    aria-label="Friend Options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {activeMenu === f.username && (
                    <>
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-1">
                        <button
                          onClick={() => {
                            navigate(`/user/${encodeURIComponent(f.username)}`);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          type="button"
                        >
                          👤 Profile
                        </button>
                        <button
                          onClick={() => {
                            handleRemoveFriend(f.username);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 flex items-center gap-2"
                          type="button"
                        >
                          Unfriend
                        </button>
                        <button
                          onClick={() => {
                            handleBlockUser(f.username);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 flex items-center gap-2"
                          type="button"
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
                    <span className="font-bold text-lg">{req.from.toLowerCase()}</span>
                    <span className="text-xs text-slate-500">wants to be friends</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecline(req.from)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded text-xs font-bold"
                      type="button"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleAccept(req.from)}
                      className="px-3 py-1 bg-sky-500 text-white rounded text-xs font-bold"
                      type="button"
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
