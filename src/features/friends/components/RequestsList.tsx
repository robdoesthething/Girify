import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

interface RequestsListProps {
  requests: any[];
  onAccept: (username: string) => void;
  onDecline: (username: string) => void;
  acceptingRequest?: string | null;
  decliningRequest?: string | null;
}

const RequestsList: React.FC<RequestsListProps> = ({
  requests,
  onAccept,
  onDecline,
  acceptingRequest,
  decliningRequest,
}) => {
  const { theme } = useTheme();

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 flex flex-col items-center gap-2 opacity-60">
        <span className="text-4xl">✉️</span>
        <p className="font-bold text-sm font-inter">No pending requests.</p>
        <p className="text-xs font-inter">When someone adds you, they&apos;ll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map(req => {
        const isAccepting = acceptingRequest === req.from;
        const isDeclining = decliningRequest === req.from;
        const isProcessing = isAccepting || isDeclining;

        return (
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
                disabled={isProcessing}
                className={`px-3 py-1 rounded text-xs font-bold transition-all active:scale-95 ${themeClasses(theme, 'bg-slate-200', 'bg-slate-800')} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
              >
                {isDeclining ? 'Ignoring...' : 'Not now'}
              </button>
              <button
                onClick={() => onAccept(req.from)}
                disabled={isProcessing}
                className={`px-3 py-1 bg-sky-500 text-white rounded text-xs font-bold transition-all active:scale-95 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
              >
                {isAccepting ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestsList;
