import React from 'react';
import { UserProfile } from '../../types/user';
import { themeClasses } from '../../utils/themeUtils';

interface RichestUsersProps {
  users: UserProfile[];
  theme: 'light' | 'dark';
}

const RichestUsers: React.FC<RichestUsersProps> = ({ users, theme }) => {
  return (
    <div
      className={`p-6 rounded-2xl border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200')}`}
    >
      <h3 className="text-xl font-bold mb-4">👑 Richest Users (Top 5)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase opacity-50">
              <th className="pb-2">User</th>
              <th className="pb-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((user, i) => (
              <tr key={user.uid || user.username}>
                <td className="py-3 font-medium">
                  <span
                    className={`mr-2 font-black ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-700' : 'opacity-50'}`}
                  >
                    #{i + 1}
                  </span>
                  {user.username}
                </td>
                <td className="py-3 text-right font-mono font-bold text-yellow-500">
                  {user.giuros} 🪙
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RichestUsers;
