import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile } from '../../utils/social';
import { themeClasses } from '../../utils/themeUtils';

interface AdminUsersTabProps {
  users: UserProfile[];
  onRefresh: () => void;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onRefresh, onView, onEdit }) => {
  const { theme } = useTheme();
  const [showBannedOnly, setShowBannedOnly] = useState(false);

  const bannedCount = users.filter(u => u.banned).length;
  const filtered = showBannedOnly ? users.filter(u => u.banned) : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-3xl font-black">User Management</h2>
          <p className="text-sm opacity-50 mt-0.5">
            {users.length} total · {bannedCount} banned
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {bannedCount > 0 && (
            <button
              onClick={() => setShowBannedOnly(v => !v)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                showBannedOnly
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              ⛔ {showBannedOnly ? `Showing ${bannedCount} banned` : `${bannedCount} banned`}
            </button>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold transition-all active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        className={`rounded-2xl overflow-hidden border ${themeClasses(theme, 'border-slate-700', 'border-slate-200')}`}
      >
        <table className="w-full text-left">
          <thead className={themeClasses(theme, 'bg-slate-800', 'bg-slate-100')}>
            <tr>
              <th className="p-4 text-xs uppercase opacity-50">User</th>
              <th className="p-4 text-xs uppercase opacity-50">Email</th>
              <th className="p-4 text-xs uppercase opacity-50">Stats</th>
              <th className="p-4 text-xs uppercase opacity-50">Giuros</th>
              <th className="p-4 text-xs uppercase opacity-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.map(user => (
              <tr
                key={user.uid || user.username}
                className={`transition-colors ${
                  user.banned
                    ? 'bg-rose-500/5 hover:bg-rose-500/10'
                    : themeClasses(theme, 'hover:bg-slate-800/50', 'hover:bg-slate-50')
                }`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{user.username}</span>
                    {user.banned && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-rose-500 text-white rounded uppercase tracking-wide">
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-50">{user.realName}</div>
                </td>
                <td className="p-4 text-sm font-mono opacity-70">{user.email || 'No email'}</td>
                <td className="p-4 text-sm">
                  <div>Games: {user.gamesPlayed || 0}</div>
                  <div>Best: {user.bestScore || 0}</div>
                  <div className="text-orange-500 font-bold">Streak: {user.streak || 0}</div>
                  <div className="opacity-70 text-xs mt-1">
                    Total: {(user.totalScore || 0).toLocaleString()}
                  </div>
                </td>
                <td className="p-4 font-mono font-bold text-yellow-500">{user.giuros || 0} 🪙</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(user)}
                      className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-lg text-xs font-bold hover:bg-purple-500 hover:text-white transition-all active:scale-95"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg text-xs font-bold hover:bg-sky-500 hover:text-white transition-all active:scale-95"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-40 text-sm">
                  {showBannedOnly ? 'No banned users.' : 'No users found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AdminUsersTab.displayName = 'AdminUsersTab';

export default AdminUsersTab;
