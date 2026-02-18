import React, { useEffect } from 'react';
import { useTopBarNav } from '../../../hooks/useTopBarNav';
import TopBar from '../../../components/TopBar';
import { PageHeader } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { useTabs } from '../../../hooks/useTabs';
import { useToast } from '../../../hooks/useToast';
import { themeClasses } from '../../../utils/themeUtils';
import { useFriends } from '../hooks/useFriends';
import FeedList from './FeedList';
import FriendsList from './FriendsList';
import RequestsList from './RequestsList';
import SearchPanel from './SearchPanel';

interface FriendsScreenProps {
  username: string;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ username }) => {
  const { theme, t } = useTheme();
  const topBarNav = useTopBarNav();

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
    acceptingRequest,
    decliningRequest,
    loadFriends,
    loadRequests,
    loadFeed,
    search,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    error,
  } = useFriends(username);

  const { error: showErrorToast } = useToast();

  // Error handling
  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

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
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar onOpenPage={topBarNav.onOpenPage} onTriggerLogin={topBarNav.onTriggerLogin} />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <PageHeader title={t('friends') || 'Friends'} />

          <div className="flex mb-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
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

          <div className="flex-1 pb-8">
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
              <RequestsList
                requests={requests}
                onAccept={acceptRequest}
                onDecline={declineRequest}
                acceptingRequest={acceptingRequest}
                decliningRequest={decliningRequest}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsScreen;
