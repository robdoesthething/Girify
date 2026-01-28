import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

interface FriendActionsProps {
  isBlocked: boolean;
  friendStatus: 'none' | 'friends' | 'pending';
  isRequestSent: boolean;
  isSendingRequest: boolean;
  isBlocking: boolean;
  onAddFriend: () => void;
  onBlock: () => void;
}

const FriendActions: React.FC<FriendActionsProps> = ({
  isBlocked,
  friendStatus,
  isRequestSent,
  isSendingRequest,
  isBlocking,
  onAddFriend,
  onBlock,
}) => {
  const { theme } = useTheme();

  const renderStatus = () => {
    if (friendStatus === 'friends') {
      return (
        <div className="w-full py-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold border border-emerald-500/20">
          ✅ Friends
        </div>
      );
    }
    if (friendStatus === 'pending' || isRequestSent) {
      return (
        <div className="w-full py-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl text-center font-bold border border-yellow-500/20">
          ⏳ Request Pending
        </div>
      );
    }
    return (
      <button
        onClick={onAddFriend}
        disabled={isSendingRequest}
        className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
        type="button"
      >
        {isSendingRequest ? 'Sending Friend Request...' : '👋 Add Friend'}
      </button>
    );
  };

  return (
    <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-800/20">
      {!isBlocked && renderStatus()}

      {isBlocked ? (
        <div className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-bold">
          🚫 Blocked
        </div>
      ) : (
        <button
          onClick={onBlock}
          disabled={isBlocking}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all opacity-60 hover:opacity-100 ${themeClasses(theme, 'text-red-400 hover:bg-red-500/10', 'text-red-500 hover:bg-red-50')}`}
          type="button"
        >
          {isBlocking ? 'Blocking...' : '🚫 Block User'}
        </button>
      )}
    </div>
  );
};

export default FriendActions;
