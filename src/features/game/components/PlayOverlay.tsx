import { AnimatePresence, motion } from 'framer-motion';
import { FC, useState } from 'react';
import Logo from '../../../components/Logo';
import { useGameContext } from '../../../context/GameContext';
import { useTheme } from '../../../context/ThemeContext';
import { DISTRICTS } from '../../../data/districts';
import { displayUsername } from '../../../utils/format';
import { themeClasses } from '../../../utils/themeUtils';

const PlayOverlay: FC = () => {
  const { theme, t } = useTheme();
  const { state, handlers } = useGameContext();
  const playedToday = handlers.hasPlayedToday();
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const handleStartPractice = (districtId?: string) => {
    setShowDistrictPicker(false);
    handlers.startPracticeMode(districtId);
  };

  return (
    <div
      className={`absolute inset-0 top-12 z-10 flex flex-col items-center justify-center backdrop-blur-sm ${themeClasses(theme, 'bg-slate-950/40', 'bg-white/40')}`}
    >
      <div className="text-center animate-fade-in-up w-full max-w-xs px-4">
        <div className="mb-6 flex justify-center">
          <Logo className="h-16 w-auto drop-shadow-lg" />
        </div>
        <h2
          className={`text-2xl md:text-4xl font-extrabold mb-4 p-4 rounded-xl ${themeClasses(theme, 'text-white', 'text-slate-900')} tracking-tight drop-shadow-md`}
        >
          {t('proveLocal') || 'Prove you are a local'}
        </h2>
        <p
          className={`text-lg mb-8 font-medium ${themeClasses(theme, 'text-slate-200', 'text-slate-700')} drop-shadow-sm`}
        >
          {t('welcomeBack') || 'Welcome back'},{' '}
          <span className="font-bold text-sky-500">
            {state.realName || displayUsername(state.username || '') || 'Guest'}
          </span>
          !
        </p>

        {/* Play button */}
        <button
          onClick={() => handlers.setupGame()}
          className={`w-full px-10 py-4 rounded-2xl text-white shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center mb-3 ${
            playedToday
              ? 'bg-slate-700 hover:bg-slate-600 shadow-slate-700/20'
              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/20'
          }`}
        >
          <span className="font-black text-xl tracking-wide uppercase">
            {playedToday ? t('replay') || 'Replay' : t('play') || 'Play'}
          </span>
        </button>

        {/* Practice button — same shape as Play */}
        <button
          onClick={() => setShowDistrictPicker(prev => !prev)}
          className={`w-full px-10 py-4 rounded-2xl font-black text-xl uppercase tracking-wide transition-all duration-200 active:scale-95 hover:scale-105 flex items-center justify-center gap-2 ${themeClasses(theme, 'text-slate-200 bg-white/10 hover:bg-white/20 shadow-white/5', 'text-slate-700 bg-slate-900/10 hover:bg-slate-900/20 shadow-slate-900/5')} shadow-xl`}
        >
          ♾️ {t('practiceMode') || 'Practice Mode'}
          <span
            className={`text-base transition-transform duration-200 ${showDistrictPicker ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>

        {/* District picker */}
        <AnimatePresence>
          {showDistrictPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col gap-2">
                {/* All districts option */}
                <button
                  onClick={() => handleStartPractice()}
                  className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all active:scale-95 ${themeClasses(theme, 'bg-white/15 hover:bg-white/25 text-white', 'bg-slate-900/10 hover:bg-slate-900/20 text-slate-800')}`}
                >
                  <span className="text-xl">🌍</span>
                  <span>All Barcelona</span>
                </button>

                {/* Per-district options */}
                <div className="grid grid-cols-2 gap-2">
                  {DISTRICTS.map(district => (
                    <button
                      key={district.id}
                      onClick={() => handleStartPractice(district.id)}
                      className={`px-3 py-2.5 rounded-xl font-bold text-xs text-left flex items-center gap-2 transition-all active:scale-95 hover:scale-102 ${themeClasses(theme, 'bg-white/10 hover:bg-white/20 text-white', 'bg-slate-900/8 hover:bg-slate-900/15 text-slate-800')}`}
                    >
                      <img
                        src={district.logo}
                        alt={district.teamName}
                        className="w-6 h-6 object-contain flex-shrink-0"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="leading-tight">{district.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlayOverlay;
