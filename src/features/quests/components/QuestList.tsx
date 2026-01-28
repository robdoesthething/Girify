import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../hooks/useToast';
import { claimQuestReward, getDailyQuests, QuestWithProgress } from '../../../services/db/quests';
import { createLogger } from '../../../utils/logger';
import { themeClasses } from '../../../utils/themeUtils';

const logger = createLogger('QuestList');

interface QuestListProps {
  onRefresh?: () => void;
  username: string;
}

export const QuestList: React.FC<QuestListProps> = ({ onRefresh, username }) => {
  const { theme, t } = useTheme();
  const { showToast } = useToast();
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  const fetchQuests = useCallback(async () => {
    if (!username) {
      return;
    }
    setLoading(true);
    try {
      const data = await getDailyQuests(username);
      setQuests(data);
    } catch (error) {
      logger.error('Error fetching quests', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const handleClaim = async (questId: number) => {
    if (!username || claiming) {
      return;
    }

    setClaiming(questId);
    try {
      const result = await claimQuestReward(questId, username);
      if (result.success) {
        showToast('success', `Claimed ${result.reward} Giuros!`);
        setQuests(prev =>
          prev.map(q =>
            q.id === questId ? { ...q, progress: { ...q.progress!, is_claimed: true } } : q
          )
        );
        if (onRefresh) {
          onRefresh();
        }
      } else {
        showToast('error', result.error || 'Failed to claim reward');
      }
    } catch {
      showToast('error', 'Unexpected error claiming reward');
    } finally {
      setClaiming(null);
    }
  };

  const renderActionButton = (
    quest: QuestWithProgress,
    isCompleted: boolean,
    isClaimed: boolean
  ) => {
    if (isClaimed) {
      return (
        <button
          disabled
          className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-500/20 text-emerald-500 opacity-50 cursor-not-allowed uppercase"
        >
          {t('claimed') || 'Claimed'}
        </button>
      );
    }
    if (isCompleted) {
      return (
        <button
          onClick={() => handleClaim(quest.id)}
          disabled={!!claiming}
          className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse uppercase transition-all"
        >
          {claiming === quest.id ? '...' : t('claim') || 'Claim'}
        </button>
      );
    }
    return (
      <div className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-500/10 text-slate-500 opacity-50 uppercase">
        {t('inProgress') || 'Active'}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4 text-xs opacity-50">Loading quests...</div>;
  }

  if (quests.length === 0) {
    return (
      <div className="text-center py-8 opacity-50 flex flex-col items-center">
        <span className="text-2xl mb-2">📜</span>
        <span className="text-sm font-bold">{t('noActiveQuests') || 'No active quests'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quests.map((quest, index) => {
        const progress = quest.progress;
        const isCompleted = progress?.is_completed || false;
        const isClaimed = progress?.is_claimed || false;
        const currentProgress = progress?.progress || 0;

        // Parse criteria value if numeric (e.g. "1000")
        const targetValue = parseInt(quest.criteria_value || '1', 10) || 1;
        const progressPercent = Math.min(100, Math.max(0, (currentProgress / targetValue) * 100));

        return (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-xl border relative overflow-hidden ${themeClasses(
              theme,
              'bg-slate-800 border-slate-700',
              'bg-white border-slate-200'
            )}`}
          >
            {/* Progress Bar Background */}
            <div
              className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
                isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${progressPercent}%`, opacity: 0.3 }}
            />

            <div className="flex justify-between items-center relative z-10">
              <div className="flex-1">
                <h4 className="font-bold text-sm font-inter">{quest.title}</h4>
                <p className="text-[10px] opacity-70 mb-1">{quest.description}</p>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono opacity-80">
                    {currentProgress} / {targetValue}
                  </div>
                  {isCompleted && (
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">
                      {t('completed') || 'Completed'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="ml-4 flex flex-col items-end gap-1">
                <div className="text-xs font-black text-yellow-500 flex items-center gap-1">
                  <span>+{quest.reward_giuros}</span>
                  <img src="/giuro.png" alt="G" className="w-3 h-3" />
                </div>
                {renderActionButton(quest, isCompleted, isClaimed)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
