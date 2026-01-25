import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

interface FriendActionsProps {
  isBlocked: boolean;
  friendStatus: 'none' | 'friends' | 'pending';
  requestSent: boolean;
  sendingRequest: boolean;
  blocking: boolean;
  onAddFriend: () => void;
  onBlock: () => void;
}

const FriendActions: React.FC<FriendActionsProps> = ({
  isBlocked,
  friendStatus,
  requestSent,
  sendingRequest,
  blocking,
  onAddFriend,
  onBlock,
}) => {
  const { theme } = useTheme();

  return (
    <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-800/20">
      {!isBlocked &&
        (friendStatus === 'friends' ? (
          <div className="w-full py-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold border border-emerald-500/20">
            ✅ Friends
          </div>
        ) : friendStatus === 'pending' || requestSent ? (
          <div className="w-full py-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl text-center font-bold border border-yellow-500/20">
            ⏳ Request Pending
          </div>
        ) : (
          <button
            onClick={onAddFriend}
            disabled={sendingRequest}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
            type="button"
          >
            {sendingRequest ? 'Sending Friend Request...' : '👋 Add Friend'}
          </button>
        ))}

      {isBlocked ? (
        <div className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-bold">
          🚫 Blocked
        </div>
      ) : (
        <button
          onClick={onBlock}
          disabled={blocking}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all opacity-60 hover:opacity-100 ${themeClasses(theme, 'text-red-400 hover:bg-red-500/10', 'text-red-500 hover:bg-red-50')}`}
          type="button"
        >
          {blocking ? 'Blocking...' : '🚫 Block User'}
        </button>
      )}
    </div>
  );
};

export default FriendActions;
