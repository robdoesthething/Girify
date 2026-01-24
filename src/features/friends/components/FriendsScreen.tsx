import React, { useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useTabs } from '../../../hooks/useTabs';
import { themeClasses } from '../../../utils/themeUtils';
import { useFriends } from '../hooks/useFriends';
import FeedList from './FeedList';
import FriendsList from './FriendsList';
import RequestsList from './RequestsList';
import SearchPanel from './SearchPanel';

interface FriendsScreenProps {
  onClose: () => void;
  username: string;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ onClose, username }) => {
  const { theme, t } = useTheme();

  // Custom hooks
  const { activeTab, setTab, isTabActive } = useTabs<'feed' | 'friends' | 'requests'>('feed');
  const {
    friends,
    requests,
    feed,
    loading,
    searchResults,
    searching,
    successfulRequests,
    loadFriends,
    loadRequests,
    loadFeed,
    search,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
  } = useFriends(username);

  // Data loading effects
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
  }, [activeTab, loadFriends, loadRequests, loadFeed]);

  const tabClass = (
    isActive: boolean
  ) => `flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2
    ${
      isActive
        ? 'border-sky-500 text-sky-500'
        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
    }`;

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto backdrop-blur-md
        ${themeClasses(theme, 'bg-neutral-950 text-white', 'bg-slate-50 text-slate-900')}`}
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
        <button
          onClick={() => setTab('feed')}
          className={tabClass(isTabActive('feed'))}
          type="button"
        >
          Feed
        </button>
        <button
          onClick={() => setTab('friends')}
          className={tabClass(isTabActive('friends'))}
          type="button"
        >
          Friends
        </button>
        <button
          onClick={() => setTab('requests')}
          className={tabClass(isTabActive('requests'))}
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
        {isTabActive('friends') && (
          <>
            <SearchPanel
              searchResults={searchResults}
              searching={searching}
              successfulRequests={successfulRequests}
              currentUsername={username}
              onSearch={search}
              onSendRequest={sendRequest}
            />
            {!loading && (
              <FriendsList friends={friends} onRemove={removeFriend} onBlock={blockUser} />
            )}
          </>
        )}

        {loading && (
          <div className="flex justify-center py-10 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        )}

        {!loading && isTabActive('feed') && (
          <FeedList feed={feed} friends={friends} onTabChange={() => setTab('friends')} t={t} />
        )}

        {!loading && isTabActive('requests') && (
          <RequestsList requests={requests} onAccept={acceptRequest} onDecline={declineRequest} />
        )}
      </div>
    </div>
  );
};

export default FriendsScreen;
