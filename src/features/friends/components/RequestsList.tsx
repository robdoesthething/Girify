import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

interface RequestsListProps {
  requests: any[];
  onAccept: (username: string) => void;
  onDecline: (username: string) => void;
}

const RequestsList: React.FC<RequestsListProps> = ({ requests, onAccept, onDecline }) => {
  const { theme } = useTheme();

  if (requests.length === 0) {
    return <p className="text-center py-10 opacity-50">No pending requests.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map(req => (
        <div
          key={req.id}
          className={`p-3 rounded-lg border flex justify-between items-center shadow-sm ${themeClasses(theme, 'bg-white border-sky-500/30', 'bg-slate-900 border-sky-500/30')}`}
        >
          <div className="flex flex-col">
            <span className="font-bold text-lg">{req.from.toLowerCase()}</span>
            <span className="text-xs text-slate-500">wants to be friends</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDecline(req.from)}
              className={`px-3 py-1 rounded text-xs font-bold ${themeClasses(theme, 'bg-slate-200', 'bg-slate-800')}`}
              type="button"
            >
              Ignore
            </button>
            <button
              onClick={() => onAccept(req.from)}
              className="px-3 py-1 bg-sky-500 text-white rounded text-xs font-bold"
              type="button"
            >
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestsList;
