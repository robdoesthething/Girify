import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CosmeticAvatar from '../../../components/ui/CosmeticAvatar';
import { DISTRICTS } from '../../../data/districts';
import { useTheme } from '../../../context/ThemeContext';
import { UI } from '../../../utils/constants';
import { displayUsername, usernamesMatch } from '../../../utils/format';
import { getCosmeticAvatarImage } from '../../../utils/shop/catalog';
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

  let dateStr = '--';
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
  const teamName = s.district ? (DISTRICTS.find(d => d.id === s.district)?.teamName ?? null) : null;
  const avatarImage = getCosmeticAvatarImage(s.equippedCosmetics?.avatarId ?? null);

  const handleClick = () => {
    if (currentUser && usernamesMatch(s.username, currentUser)) {
      navigate('/profile');
    } else {
      navigate(`/u/${encodeURIComponent(s.username)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * UI.ANIMATION.DURATION_FAST }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]
        ${isMe ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10 hover:bg-sky-500/20 hover:shadow-sky-500/30' : themeClasses(theme, 'bg-slate-800 border-slate-700 hover:border-slate-600', 'bg-white border-slate-200 hover:border-sky-200 shadow-sm')}
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 flex items-center justify-center rounded-full font-black text-xs shrink-0
            ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 opacity-50'}
          `}
        >
          {index + 1}
        </div>
        <CosmeticAvatar
          image={avatarImage}
          fallback="🏙️"
          size={32}
          alt={`${s.username} avatar`}
          className="shrink-0"
        />
        <div>
          <div className="font-bold text-sm flex items-center gap-2 font-inter">
            {displayUsername(s.username)}
            {isMe && (
              <span className="text-[10px] bg-sky-500 text-white px-1.5 rounded-full font-inter">
                YOU
              </span>
            )}
          </div>
          {teamName ? (
            <div className="text-[10px] font-semibold opacity-60 font-inter truncate max-w-[140px]">
              {teamName}
            </div>
          ) : (
            <div className="text-[10px] opacity-70 font-mono">{dateStr}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-black text-lg text-sky-500 font-inter">{s.score.toLocaleString()}</div>
        <div className="text-[9px] font-bold opacity-65 uppercase font-inter">Points</div>
      </div>
    </motion.div>
  );
};

export default IndividualScoreRow;
