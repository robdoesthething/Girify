import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';

interface HintStreet {
  id: string;
  name: string;
}

interface HintsProps {
  hintStreets: HintStreet[];
  hintsRevealed: number;
  onReveal: () => void;
  feedback: 'idle' | 'transitioning' | 'selected';
}

const Hints: React.FC<HintsProps> = ({ hintStreets, hintsRevealed, onReveal, feedback }) => {
  const { t } = useTheme();

  const canReveal = hintsRevealed < 3 && hintsRevealed < hintStreets.length;
  const hasRevealed = hintsRevealed > 0;

  if (hintStreets.length === 0) {
    return null;
  }

  return (
    <div className="px-3 pb-2 flex flex-col gap-1.5">
      {/* Revealed hints */}
      {hasRevealed && (
        <div className="flex flex-col gap-1">
          {hintStreets.slice(0, hintsRevealed).map(street => (
            <div
              key={street.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 animate-fadeIn"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="text-xs font-semibold text-sky-300">Near: {street.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reveal button */}
      {canReveal && feedback === 'idle' && (
        <button
          onClick={onReveal}
          type="button"
          className="w-full py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-95 transition-all border border-sky-500/30 flex items-center justify-center gap-2"
        >
          <span className="text-sky-400 text-sm">💡</span>
          <span className="text-xs font-black uppercase tracking-wider text-sky-400">
            {t('revealHint') || 'Hint'}{' '}
            <span className="opacity-60 font-mono">
              ({hintsRevealed}/{Math.min(3, hintStreets.length)})
            </span>
          </span>
        </button>
      )}
    </div>
  );
};

export default Hints;
