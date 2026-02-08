import React, { FC, useEffect, useState } from 'react';
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
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    const completed = localStorage.getItem('girify_onboarding_completed');
    return !completed && !state.username;
  });

  // Exit Warning
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
            onAnimationComplete={() => dispatch({ type: 'UNLOCK_INPUT' })}
          />
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

      {/* For non-logged users: show full LandingPage */}
      {state.gameState === 'intro' && !state.username && (
        <LandingPage
          theme={theme}
          hasPlayedToday={handlers.hasPlayedToday()}
          onStart={() => {
            const seen = localStorage.getItem('girify_instructions_seen');
            if (seen === 'true') {
              dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
            } else {
              dispatch({ type: 'SET_GAME_STATE', payload: 'instructions' });
            }
          }}
          onLogin={() => {
            dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
          }}
        />
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
            username={state.username ?? undefined}
            realName={state.realName ?? undefined} // Pass real name
            streak={state.streak} // Pass streak
            onRestart={() => handlers.setupGame()}
            onBackToMenu={() => dispatch({ type: 'SET_GAME_STATE', payload: 'intro' })}
            quizResults={state.quizResults}
            quizStreets={state.quizStreets}
            t={t}
          />
        </div>
      )}

      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
};

export default React.memo(GameScreen);
