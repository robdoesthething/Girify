import { FC } from 'react';
import Logo from '../../../components/Logo';
import { useGameContext } from '../../../context/GameContext';
import { useTheme } from '../../../context/ThemeContext';
import { displayUsername } from '../../../utils/format';
import { themeClasses } from '../../../utils/themeUtils';
import { QuestList } from '../../quests/components/QuestList';

const PlayOverlay: FC = () => {
  const { theme, t } = useTheme();
  const { state, handlers } = useGameContext();

  return (
    <div
      className={`absolute inset-0 top-12 z-10 flex flex-col items-center justify-center backdrop-blur-sm ${themeClasses(theme, 'bg-slate-950/70', 'bg-white/70')}`}
    >
      <div className="text-center animate-fade-in-up">
        <div className="mb-6 flex justify-center">
          <Logo className="h-16 w-auto" />
        </div>
        <h2
          className={`text-2xl md:text-4xl font-extrabold mb-4 p-4 rounded-xl backdrop-blur-md ${themeClasses(theme, 'text-white bg-slate-900/40', 'text-slate-800 bg-white/40')} tracking-tight`}
        >
          {t('proveLocal') || 'Prove you are a local'}
        </h2>
        <p
          className={`text-lg mb-10 font-medium ${themeClasses(theme, 'text-slate-300', 'text-slate-600')}`}
        >
          {t('welcomeBack') || 'Welcome back'},{' '}
          {state.profileLoaded ? state.realName || displayUsername(state.username ?? '') : '...'}!
        </p>
        <button
          onClick={() => handlers.setupGame()}
          className={`px-10 py-4 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center mx-auto ${
            handlers.hasPlayedToday()
              ? 'bg-slate-700 hover:bg-slate-600 shadow-slate-700/30'
              : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
          }`}
        >
          <span className="font-bold text-lg tracking-wide">
            {handlers.hasPlayedToday() ? t('replay') || 'Replay' : t('play') || 'Play'}
          </span>
        </button>
        <div className="mt-8 w-full max-w-sm">
          <h3
            className={`text-sm font-bold uppercase mb-2 ${themeClasses(theme, 'text-slate-400', 'text-slate-500')}`}
          >
            {t('todaysChallenge') || "Today's Challenge"}
          </h3>
          <QuestList username={state.username || ''} />
        </div>
      </div>
    </div>
  );
};

export default PlayOverlay;
