import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { DISTRICTS } from '../../../data/districts';
import { UI } from '../../../utils/constants';
import { TeamScoreEntry } from '../../../utils/social/leaderboard';
import { themeClasses } from '../../../utils/themeUtils';

interface TeamScoreRowProps {
  team: TeamScoreEntry;
  index: number;
}

const TeamScoreRow: React.FC<TeamScoreRowProps> = ({ team, index }) => {
  const { theme } = useTheme();
  const district = DISTRICTS.find(d => d.teamName === team.teamName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * UI.ANIMATION.DURATION_FAST }}
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all
        ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200 shadow-sm')}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-sm relative overflow-hidden
            ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : index === 2 ? 'bg-amber-600' : 'bg-slate-100 dark:bg-slate-700'}
          `}
        >
          {district?.logo ? (
            <img src={district.logo} alt={team.teamName} className="w-full h-full object-cover" />
          ) : (
            index + 1
          )}
        </div>
        <div>
          <div className="font-bold text-sm flex items-center gap-2 font-inter">
            {team.teamName}
          </div>
          <div className="text-[10px] opacity-50 font-mono flex items-center gap-2">
            <span>
              {team.memberCount} {team.memberCount === 1 ? 'player' : 'players'}
            </span>
            <span>•</span>
            <span>avg {team.avgScore.toLocaleString()} pts</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-black text-lg text-emerald-500 font-inter">
          {team.score.toLocaleString()}
        </div>
        <div className="text-[9px] font-bold opacity-40 uppercase font-inter">Total Points</div>
      </div>
    </motion.div>
  );
};

export default TeamScoreRow;
