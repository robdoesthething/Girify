import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserLinkProps {
  name: string;
  avatar: ReactNode;
  children: ReactNode;
}

const UserLink: React.FC<UserLinkProps> = ({ name, avatar, children }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/user/${encodeURIComponent(name)}`)}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left group"
      type="button"
    >
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
        {avatar}
      </div>
      <div>{children}</div>
    </button>
  );
};

export default UserLink;
