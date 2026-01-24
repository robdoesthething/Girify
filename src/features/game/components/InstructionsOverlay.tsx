import { FC } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useTheme } from '../../../context/ThemeContext';
import { themeClasses } from '../../../utils/themeUtils';

const InstructionsOverlay: FC = () => {
  const { theme, t } = useTheme();
  const { state, dispatch, handlers } = useGameContext();

  const handleNext = () => {
    localStorage.setItem('girify_instructions_seen', 'true');
    if (state.username) {
      handlers.setupGame();
    } else {
      dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
    }
  };

  return (
    <div
      className={`absolute inset-0 z-[2000] flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-1000 ${themeClasses(theme, 'bg-slate-950/80 text-white', 'bg-slate-50/80 text-slate-900')}`}
    >
      <h2 className="heading-lg mb-8 text-sky-400">{t('howToPlay')}</h2>
      <ul className="text-left space-y-6 text-xl mb-12 max-w-md mx-auto">
        <li className="flex gap-4 items-center">
          <span className="text-2xl">📍</span>
          <span>{t('instructionsPoint1')}</span>
        </li>
        <li className="flex gap-4 items-center">
          <span className="text-2xl">🤔</span>
          <span>{t('instructionsPoint2')}</span>
        </li>
        <li className="flex gap-4 items-center">
          <span className="text-2xl">💡</span>
          <span>{t('instructionsPoint3')}</span>
        </li>
        <li className="flex gap-4 items-center text-emerald-400 font-bold">
          <span className="text-2xl">⏳</span>
          <span>{t('instructionsPoint4')}</span>
        </li>
      </ul>
      <button
        onClick={handleNext}
        className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 font-bold text-xl transition-all transform hover:scale-105"
      >
        {state.username ? t('imReady') : t('next')}
      </button>
    </div>
  );
};

export default InstructionsOverlay;
