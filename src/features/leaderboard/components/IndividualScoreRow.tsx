import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { UI } from '../../../utils/constants';
import { formatUsername, usernamesMatch } from '../../../utils/format';
import { ScoreEntry } from '../../../utils/social/leaderboard';
import { themeClasses } from '../../../utils/themeUtils';

interface IndividualScoreRowProps {
  entry: ScoreEntry;
  index: number;
  currentUser?: string;
}

const IndividualScoreRow: React.FC<IndividualScoreRowProps> = ({
  entry: s,
  index,
  currentUser,
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  let dateStr = 'Unknown';
  try {
    const ts = s.timestamp;
    if (ts && typeof ts === 'object' && 'seconds' in ts) {
      dateStr = new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } else if (typeof ts === 'number' || typeof ts === 'string') {
      dateStr = new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  } catch {
    dateStr = '--';
  }

  const isMe = currentUser && usernamesMatch(s.username, currentUser);

  const handleClick = () => {
    if (usernamesMatch(s.username, currentUser)) {
      navigate('/profile');
    } else {
      navigate(`/user/${encodeURIComponent(s.username)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * UI.ANIMATION.DURATION_FAST }}
      key={s.id || index}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]
        ${isMe ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10' : themeClasses(theme, 'bg-slate-800 border-slate-700 hover:border-slate-600', 'bg-white border-slate-200 hover:border-sky-200 shadow-sm')}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm relative overflow-hidden
            ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 opacity-50'}
          `}
        >
          {index + 1}
        </div>
        <div>
          <div className="font-bold text-sm flex items-center gap-2 font-inter">
            {formatUsername(s.username)}
            {isMe && (
              <span className="text-[10px] bg-sky-500 text-white px-1.5 rounded-full font-inter">
                YOU
              </span>
            )}
          </div>
          <div className="text-[10px] opacity-50 font-mono">{dateStr}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-black text-lg text-sky-500 font-inter">{s.score.toLocaleString()}</div>
        <div className="text-[9px] font-bold opacity-40 uppercase font-inter">Points</div>
      </div>
    </motion.div>
  );
};

export default IndividualScoreRow;
