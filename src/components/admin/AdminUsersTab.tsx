/**
 * AdminUsersTab Component
 *
 * User management table for admin panel.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile } from '../../types/user';
import { themeClasses } from '../../utils/themeUtils';

interface AdminUsersTabProps {
  users: UserProfile[];
  onRefresh: () => void;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onRefresh, onView, onEdit }) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">User Management</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold"
        >
          Refresh
        </button>
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
            {users.map(user => (
              <tr
                key={user.uid || user.username}
                className={themeClasses(theme, 'hover:bg-slate-800/50', 'hover:bg-slate-50')}
              >
                <td className="p-4">
                  <div className="font-bold">{user.username}</div>
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
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => onView(user)}
                    className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-lg text-xs font-bold hover:bg-purple-500 hover:text-white transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg text-xs font-bold hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AdminUsersTab.displayName = 'AdminUsersTab';

export default AdminUsersTab;
