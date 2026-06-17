import { FC } from 'react';
import Logo from '../../../components/Logo';
import { useGameContext } from '../../../context/GameContext';
import { useTheme } from '../../../context/ThemeContext';
import { displayUsername } from '../../../utils/format';
import { themeClasses } from '../../../utils/themeUtils';

const PlayOverlay: FC = () => {
  const { theme, t } = useTheme();
  const { state, handlers } = useGameContext();
  const playedToday = handlers.hasPlayedToday();

  return (
    <div
      className={`absolute inset-0 top-12 z-10 flex flex-col items-center justify-center backdrop-blur-sm ${themeClasses(theme, 'bg-slate-950/40', 'bg-white/40')}`}
    >
      <div className="text-center animate-fade-in-up">
        <div className="mb-6 flex justify-center">
          <Logo className="h-16 w-auto drop-shadow-lg" />
        </div>
        <h2
          className={`text-2xl md:text-4xl font-extrabold mb-4 p-4 rounded-xl ${themeClasses(theme, 'text-white', 'text-slate-900')} tracking-tight drop-shadow-md`}
        >
          {t('proveLocal') || 'Prove you are a local'}
        </h2>
        <p
          className={`text-lg mb-10 font-medium ${themeClasses(theme, 'text-slate-200', 'text-slate-700')} drop-shadow-sm`}
        >
          {t('welcomeBack') || 'Welcome back'},{' '}
          <span className="font-bold text-sky-500">
            {state.realName || displayUsername(state.username || '') || 'Guest'}
          </span>
          !
        </p>
        <button
          onClick={() => handlers.setupGame()}
          className={`px-10 py-5 rounded-2xl text-white shadow-xl shadow-sky-500/20 transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center mx-auto ${
            playedToday
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500'
          }`}
        >
          <span className="font-black text-xl tracking-wide uppercase">
            {playedToday ? t('replay') || 'Replay' : t('play') || 'Play'}
          </span>
        </button>

        <button
          onClick={() => handlers.startPracticeMode()}
          className={`mt-4 px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all active:scale-95 hover:scale-105 flex items-center gap-2 mx-auto ${themeClasses(theme, 'text-slate-300 hover:text-white bg-white/10 hover:bg-white/20', 'text-slate-600 hover:text-slate-900 bg-slate-900/10 hover:bg-slate-900/20')}`}
        >
          ♾️ {t('practiceMode') || 'Practice Mode'}
        </button>
      </div>
    </div>
  );
};

export default PlayOverlay;
