import { AnimatePresence, motion } from 'framer-motion';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import LandingPage from '../../../components/LandingPage';
import { useGameContext } from '../../../context/GameContext';
import { useTheme } from '../../../context/ThemeContext';
import { Street } from '../../../types/game';
import { UI } from '../../../utils/constants';
import { themeClasses } from '../../../utils/themeUtils';
import RegisterPanel from '../../auth/components/RegisterPanel';
import InstructionsOverlay from './InstructionsOverlay';
import MapArea from './MapArea';
import OnboardingTour from './OnboardingTour';
import PlayOverlay from './PlayOverlay';
import Quiz from './Quiz';
import SummaryScreen from './SummaryScreen';

const GameScreen: FC = () => {
  const { theme, deviceMode, t } = useTheme();
  const { state, dispatch, currentStreet, handlers } = useGameContext();
  const lastResult =
    state.quizResults.length > 0 ? state.quizResults[state.quizResults.length - 1] : null;
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    const completed = localStorage.getItem('girify_onboarding_completed');
    return !completed && !!state.username;
  });

  // Block in-app navigation during an active game
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      state.gameState === 'playing' && currentLocation.pathname !== nextLocation.pathname
  );

  // Exit Warning (hard reload / tab close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.gameState === 'playing') {
        const msg = t('exitGameWarning') || 'Exit game?';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.gameState, t]);

  const handleAnimationComplete = useCallback(() => {
    dispatch({ type: 'UNLOCK_INPUT' });
  }, [dispatch]);

  const handleManualNext = () => {
    if (state.feedback === 'selected' && state.selectedAnswer) {
      handlers.processAnswer(state.selectedAnswer);
      setTimeout(() => {
        handlers.handleNext();
      }, UI.ANIMATION.DELAY_TRANSITION_MS);
    } else if (state.feedback === 'transitioning') {
      handlers.handleNext();
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col w-full h-full relative overflow-hidden font-inter ${themeClasses(theme, 'bg-slate-950 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      {state.gameState === 'playing' && (
        <Quiz.Banner
          currentQuestionIndex={state.currentQuestionIndex}
          totalQuestions={state.quizStreets.length}
          practiceMode={state.practiceMode}
          onExit={() => dispatch({ type: 'SET_GAME_STATE', payload: 'intro' })}
        />
      )}

      <div
        className={`flex-1 flex ${['mobile', 'tablet'].includes(deviceMode) ? 'flex-col' : 'flex-row'} overflow-hidden relative z-0`}
      >
        {/* Map Area */}
        <div
          className={`relative z-0 min-w-0 ${['mobile', 'tablet'].includes(deviceMode) ? 'flex-1 w-full order-1' : 'flex-1 h-full order-1'}`}
        >
          <MapArea
            currentStreet={currentStreet ?? null}
            hintStreets={
              state.gameState === 'playing'
                ? state.hintStreets.slice(0, state.hintsRevealedCount)
                : []
            }
            theme={theme}
            onAnimationComplete={handleAnimationComplete}
          />
          <AnimatePresence>
            {state.feedback === 'transitioning' && lastResult && (
              <motion.div
                key={state.currentQuestionIndex}
                initial={{ opacity: 1, y: 0, scale: 1.3 }}
                animate={{ opacity: 0, y: -80, scale: 0.9 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none"
              >
                <span
                  className={`text-7xl font-black drop-shadow-2xl ${lastResult.status === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}
                  style={{
                    textShadow:
                      lastResult.status === 'correct'
                        ? '0 0 30px rgba(52,211,153,0.6)'
                        : '0 0 30px rgba(248,113,113,0.6)',
                  }}
                >
                  {lastResult.status === 'correct' ? `+${lastResult.points}` : '✗'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quiz Dashboard Panel */}
        {state.gameState === 'playing' && (
          <div
            className={`
                  relative z-20 shrink-0
                  glass-panel rounded-none border-l border-white/10
                  ${
                    ['mobile', 'tablet'].includes(deviceMode)
                      ? 'w-full h-[33%] order-2 border-t rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]'
                      : 'w-[400px] lg:w-[450px] h-full order-2'
                  }
               `}
          >
            <Quiz>
              <Quiz.Container keyProp={state.currentQuestionIndex}>
                <Quiz.ScoreTimer
                  questionStartTime={state.questionStartTime}
                  hintsUsed={state.hintsRevealedCount}
                  feedback={state.feedback as any}
                />
                <Quiz.Content>
                  <Quiz.Options
                    options={state.options}
                    onSelect={option => {
                      const street = option as Street;
                      if (state.feedback === 'transitioning') {
                        return;
                      }
                      if (state.autoAdvance) {
                        handlers.handleSelectAnswer(street);
                      } else {
                        dispatch({ type: 'SELECT_ANSWER', payload: street });
                      }
                    }}
                    selectedAnswer={state.selectedAnswer}
                    feedback={state.feedback as any}
                    disabled={state.isInputLocked}
                  />
                </Quiz.Content>

                <Quiz.Hints
                  hintStreets={state.hintStreets}
                  hintsRevealed={state.hintsRevealedCount}
                  onReveal={() => dispatch({ type: 'REVEAL_HINT' })}
                  feedback={state.feedback as any}
                />

                {!state.autoAdvance && (
                  <Quiz.NextButton
                    onNext={handleManualNext}
                    isLastQuestion={state.currentQuestionIndex >= state.quizStreets.length - 1}
                    isSubmit={state.feedback === 'selected'}
                    feedback={state.feedback as any}
                    disabled={!state.selectedAnswer && state.feedback === 'idle'}
                  />
                )}
              </Quiz.Container>
            </Quiz>
          </div>
        )}
      </div>

      {/* For logged-in users in intro state: show map with play overlay */}
      {state.gameState === 'intro' && state.username && <PlayOverlay />}

      {/* For non-logged users: show full LandingPage (scrollable over the clipped game layout) */}
      {state.gameState === 'intro' && !state.username && (
        <div className="absolute inset-0 overflow-y-auto z-20">
          <LandingPage
            theme={theme}
            onLogin={() => {
              dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
            }}
          />
        </div>
      )}

      {state.gameState === 'instructions' && <InstructionsOverlay />}

      {state.gameState === 'register' && (
        <RegisterPanel
          theme={theme}
          onRegister={handlers.handleRegister}
          onClose={() => dispatch({ type: 'SET_GAME_STATE', payload: 'intro' })}
          initialMode={state.registerMode}
        />
      )}

      {state.gameState === 'summary' && (
        <div className="absolute inset-0 z-50 pointer-events-auto">
          <SummaryScreen
            score={state.score}
            total={state.quizStreets.length}
            theme={theme}
            streak={state.streak}
            onRestart={() => handlers.setupGame()}
            onBackToMenu={() => dispatch({ type: 'SET_GAME_STATE', payload: 'intro' })}
            onKeepPlaying={handlers.startPracticeMode}
            quizResults={state.quizResults}
            quizStreets={state.quizStreets}
            t={t}
          />
        </div>
      )}

      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}

      {blocker.state === 'blocked' && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm mx-4 text-white text-center shadow-2xl">
            <p className="text-lg font-bold mb-1">{t('exitGameWarning') || 'Leave game?'}</p>
            <p className="text-sm opacity-60 mb-6">
              {t('exitGameWarningDetail') || 'Your progress will be lost.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => blocker.reset()}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold transition-colors"
                type="button"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => blocker.proceed()}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 font-bold transition-colors"
                type="button"
              >
                {t('leave') || 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(GameScreen);
