import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvatar } from '../../../data/avatars';
import { formatUsername } from '../../../utils/format';

export interface Friend {
  username: string;
  avatarId?: number;
  badges?: string[];
  todayGames?: number;
  equippedCosmetics?: {
    avatarId?: string;
    frameId?: string;
    titleId?: string;
  };
}

interface FriendItemProps {
  friend: Friend;
  onRemove: (username: string) => void;
  onBlock: (username: string) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, onRemove, onBlock }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(false);

  const equippedAvatarId = friend.equippedCosmetics?.avatarId;
  const hasCustomAvatar = equippedAvatarId && equippedAvatarId.startsWith('pixel_');
  const avatarUrl = hasCustomAvatar ? `/assets/districts/${equippedAvatarId}.png` : null;

  return (
    <div className="p-3 rounded-lg border flex justify-between items-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors relative">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br from-sky-400 to-indigo-600 border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
          ) : (
            getAvatar(friend.avatarId || 1)
          )}
        </div>
        <div>
          <h4 className="font-bold text-sm leading-tight">{formatUsername(friend.username)}</h4>
          {friend.badges && friend.badges.length > 0 && (
            <span className="text-xs mr-2" title="Equipped Badge">
              {typeof friend.badges[0] === 'string' ? friend.badges[0] : '🏅'}
            </span>
          )}
          {friend.todayGames && friend.todayGames > 0 ? (
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
            setActiveMenu(!activeMenu);
          }}
          className="p-2 ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          type="button"
          aria-label="Friend Options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {activeMenu && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setActiveMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-1">
              <button
                onClick={() => {
                  navigate(`/user/${encodeURIComponent(friend.username)}`);
                  setActiveMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                type="button"
              >
                👤 Profile
              </button>
              <button
                onClick={() => {
                  onRemove(friend.username);
                  setActiveMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 flex items-center gap-2"
                type="button"
              >
                Unfriend
              </button>
              <button
                onClick={() => {
                  onBlock(friend.username);
                  setActiveMenu(false);
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
  );
};

export default FriendItem;
