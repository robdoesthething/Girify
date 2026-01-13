import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface Achievement {
  id?: string;
  name?: string;
  description?: string;
  image?: string;
  emoji?: string;
  flavorText?: string;
}

interface AchievementModalProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onDismiss }) => {
  const { theme, t } = useTheme();

  if (!achievement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className={`relative z-10 w-full max-w-sm p-8 rounded-3xl shadow-2xl text-center overflow-hidden
                  ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  border-4 border-yellow-500
              `}
      >
        {/* Confetti / Rays Effect Background */}
        <div className="absolute inset-0 z-0 opacity-10 animate-spin-slow">
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-500 fill-current">
            <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
          </svg>
        </div>

        <div className="relative z-10">
          <h3 className="text-xs font-black text-yellow-500/80 uppercase tracking-widest mb-1 font-inter">
            {t('new') || 'NEW'}
          </h3>
          <h3 className="text-lg font-black text-yellow-500 uppercase tracking-wider mb-4 font-inter">
            {t('achievementUnlocked') || 'Achievement Unlocked!'}
          </h3>

          <div className="mb-6 flex justify-center">
            {achievement.image ? (
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-30 rounded-full" />
                <img
                  src={achievement.image}
                  alt={achievement.name}
                  className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500"
                />
              </div>
            ) : (
              <span className="text-8xl filter drop-shadow-2xl animate-bounce-slow inline-block">
                {achievement.emoji}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black mb-2 leading-tight font-inter">{achievement.name}</h2>

          <p className="text-lg font-medium opacity-80 mb-6 italic font-inter">
            &quot;{achievement.description}&quot;
          </p>

          {achievement.flavorText && (
            <div className="bg-yellow-500/10 p-3 rounded-xl mb-6">
              <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide font-inter">
                {achievement.flavorText}
              </p>
            </div>
          )}

          <button
            onClick={onDismiss}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-xl font-black text-lg shadow-lg shadow-yellow-500/30 transform hover:scale-[1.02] transition-all font-inter"
            type="button"
          >
            {t('okay') || 'Okay'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AchievementModal;
