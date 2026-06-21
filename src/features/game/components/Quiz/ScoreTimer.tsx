import { useEffect, useState } from 'react';
import { calculateScore } from '../../../../config/gameConfig';

interface ScoreTimerProps {
  questionStartTime: number | null;
  hintsUsed: number;
  feedback: 'idle' | 'selected' | 'transitioning';
}

const ScoreTimer: React.FC<ScoreTimerProps> = ({ questionStartTime, hintsUsed, feedback }) => {
  const [potential, setPotential] = useState(100);

  useEffect(() => {
    if (feedback !== 'idle' || !questionStartTime) {
      return undefined;
    }

    const tick = () => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      setPotential(calculateScore(elapsed, true, hintsUsed));
    };

    tick();
    const id = setInterval(tick, 150);
    return () => clearInterval(id);
  }, [questionStartTime, hintsUsed, feedback]);

  if (feedback !== 'idle' || !questionStartTime) {
    return null;
  }

  const color =
    potential >= 80 ? 'text-emerald-400' : potential >= 50 ? 'text-amber-400' : 'text-rose-400';
  const bg =
    potential >= 80
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : potential >= 50
        ? 'bg-amber-500/10 border-amber-500/20'
        : 'bg-rose-500/10 border-rose-500/20';

  return (
    <div className={`mx-3 mb-1 px-3 py-1.5 rounded-xl border ${bg} flex items-center gap-2`}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Pts</span>
      <span className={`text-xl font-black leading-none tabular-nums ${color}`}>{potential}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-none ${potential >= 80 ? 'bg-emerald-400' : potential >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
          style={{ width: `${potential}%` }}
        />
      </div>
      <span className="text-[10px] opacity-30">/ 100</span>
    </div>
  );
};

export default ScoreTimer;
