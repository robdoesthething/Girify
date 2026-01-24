import React from 'react';
import { ACTIVITY_TYPES } from '../../../data/activityTypes';
import { getAvatar } from '../../../data/avatars';
import { FeedItem, Friend } from '../hooks/useFriends';
import UserLink from './UserLink';

interface FeedListProps {
  feed: FeedItem[];
  friends: Friend[];
  onTabChange: (tab: 'friends') => void;
  t: (key: string) => string;
}

const FeedList: React.FC<FeedListProps> = ({ feed, friends, onTabChange, t }) => {
  if (feed.length === 0) {
    return (
      <div className="text-center py-10 opacity-50">
        <p>No recent activity from friends.</p>
        <button
          onClick={() => onTabChange('friends')}
          className="text-sky-500 font-bold mt-2 hover:underline"
          type="button"
        >
          Add some friends!
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feed.map(item => {
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
              <div className="flex items-center gap-4">
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
      })}
    </div>
  );
};

export default FeedList;
