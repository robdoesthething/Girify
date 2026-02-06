import React, { useState } from 'react';
import { TOAST_SHORT_MS } from '../../../config/appConstants';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../hooks/useToast';
import { themeClasses } from '../../../utils/themeUtils';

interface SearchPanelProps {
  searchResults: any[];
  searching: boolean;
  successfulRequests: Set<string>;
  currentUsername: string;
  onSearch: (query: string) => void;
  onSendRequest: (username: string) => Promise<{ success: boolean; error?: string }>;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  searchResults,
  searching,
  successfulRequests,
  onSearch,
  onSendRequest,
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const { success, error, info } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleSend = async (targetUser: string) => {
    info(`Sending request to ${targetUser}...`);
    const res = await onSendRequest(targetUser);
    if (res.success) {
      success(`Request sent to ${targetUser}!`, TOAST_SHORT_MS);
    } else {
      error(res.error || 'Failed to send request');
    }
  };

  return (
    <div
      className={`mb-8 p-4 rounded-xl border ${themeClasses(theme, 'bg-slate-900 border-slate-800', 'bg-slate-100 border-slate-200')}`}
    >
      <h3 className="font-bold mb-3">Add Friend</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search username..."
          className={`flex-1 px-4 py-2 rounded-lg border text-sm ${themeClasses(theme, 'bg-slate-800 border-slate-700 text-white placeholder-slate-400', 'bg-white border-slate-300 text-slate-900 placeholder-slate-400')}`}
          aria-label="Search username"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 bg-sky-500 text-white font-bold rounded-lg text-sm disabled:opacity-50"
        >
          {searching ? '...' : 'Search'}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="mt-4 space-y-2">
          {searchResults.map(u => (
            <div
              key={u.username}
              className={`flex justify-between items-center p-2 rounded ${themeClasses(theme, 'bg-slate-800', 'bg-white')}`}
            >
              <span className="font-bold">{u.username.toLowerCase()}</span>
              <button
                onClick={() => handleSend(u.username)}
                disabled={successfulRequests.has(u.username)}
                className={`text-xs px-3 py-1 rounded transition-colors font-bold
                    ${
                      successfulRequests.has(u.username)
                        ? 'bg-emerald-500 text-white cursor-default'
                        : themeClasses(
                            theme,
                            'bg-slate-700 hover:bg-sky-500 hover:text-white',
                            'bg-slate-200 hover:bg-sky-500 hover:text-white'
                          )
                    }
                  `}
                type="button"
              >
                {successfulRequests.has(u.username) ? 'Sent' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
