import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import MapArea from './MapArea';
import Quiz from './Quiz';
import RegisterPanel from './RegisterPanel';
import SummaryScreen from './SummaryScreen';
import Logo from './Logo';
import OnboardingTour from './OnboardingTour';

const GameScreen = ({
  state,
  dispatch,
  theme,
  deviceMode,
  t,
  currentStreet,
  handleSelectAnswer,
  handleNext,
  processAnswer,
  setupGame,
  handleRegister,
  hasPlayedToday,
}) => {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show only if not completed and not logged in (no username in state)
    // We check props.state.username which is available in closure
    const completed = localStorage.getItem('girify_onboarding_completed');
    return !completed && !state.username;
  });

  // New helper for Manual Mode: Submit -> Delay -> Next
  const handleManualNext = () => {
    // 1. Submit Answer
    if (state.feedback === 'selected') {
      processAnswer(state.selectedAnswer);

      // 2. Wait 1.5s then Advance
      setTimeout(() => {
        handleNext();
      }, 1500);
    }
    // If somehow already submitted (e.g. fast clicks), just advance
    else if (state.feedback === 'transitioning') {
      handleNext();
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
      {state.gameState === 'playing' && (
        <Quiz.Banner
          currentQuestionIndex={state.currentQuestionIndex}
          totalQuestions={state.quizStreets.length}
        />
      )}

      <div
        className={`flex-1 flex ${['mobile', 'tablet'].includes(deviceMode) ? 'flex-col' : 'flex-row'} overflow-hidden bg-slate-50`}
      >
        <div
          className={`relative z-0 min-w-0 ${['mobile', 'tablet'].includes(deviceMode) ? 'flex-1 w-full order-1' : 'flex-1 h-full order-1'}`}
        >
          <MapArea
            currentStreet={currentStreet}
            hintStreets={
              state.gameState === 'playing'
                ? state.hintStreets.slice(0, state.hintsRevealedCount)
                : []
            }
            theme={theme}
          />
        </div>

        {state.gameState === 'playing' && (
          <div
            className={`
                  relative z-20 backdrop-blur-sm shadow-xl shrink-0
                  bg-white/95 border-slate-200
                  ${
                    ['mobile', 'tablet'].includes(deviceMode)
                      ? 'w-full h-[40%] order-2 border-t'
                      : 'w-[350px] lg:w-[400px] h-full order-2 border-l'
                  }
               `}
          >
            <Quiz>
              <Quiz.Container keyProp={state.currentQuestionIndex}>
                <Quiz.Content>
                  <Quiz.Options
                    options={state.options}
                    onSelect={street => {
                      // If transitioning, ignore
                      if (state.feedback === 'transitioning') return;

                      if (state.autoAdvance) {
                        // Auto-mode: Select and Process immediately
                        handleSelectAnswer(street);
                      } else {
                        // Manual mode: Just select, wait for submit
                        dispatch({ type: 'SELECT_ANSWER', payload: street });
                      }
                    }}
                    selectedAnswer={state.selectedAnswer}
                    feedback={state.feedback}
                    correctName={currentStreet?.name}
                    autoAdvance={state.autoAdvance}
                  />
                </Quiz.Content>

                <Quiz.Hints
                  hintStreets={state.hintStreets}
                  hintsRevealed={state.hintsRevealedCount}
                  onReveal={() => dispatch({ type: 'REVEAL_HINT' })}
                  feedback={state.feedback}
                />

                {/* Manual Mode: Single "Next" Button */}
                {/* Changes from "Wait" (disabled) -> "Next" (submit+advance) */}
                {!state.autoAdvance && (
                  <Quiz.NextButton
                    onNext={handleManualNext}
                    isLastQuestion={state.currentQuestionIndex >= state.quizStreets.length - 1}
                    // If 'selected', it acts as Submit. If 'transitioning', it's waiting/advancing.
                    // We disable it if nothing selected yet.
                    isSubmit={state.feedback === 'selected'}
                    feedback={state.feedback}
                    disabled={!state.selectedAnswer && state.feedback === 'idle'}
                  />
                )}
              </Quiz.Container>
            </Quiz>
          </div>
        )}
      </div>

      {state.gameState === 'intro' && (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm pointer-events-auto overflow-hidden">
          <div className="max-w-xs md:max-w-md w-full flex flex-col items-center">
            <Logo className="mb-6 h-16 md:h-24 w-auto object-contain" />
            <p
              className={`text-lg md:text-xl mb-8 font-light text-center px-4 animate-fadeIn ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Can you name the city's most iconic streets?
            </p>

            <button
              onClick={() => {
                const seen = localStorage.getItem('girify_instructions_seen');
                if (state.username || seen === 'true') {
                  if (state.username) {
                    setupGame();
                  } else {
                    dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
                  }
                } else {
                  dispatch({ type: 'SET_GAME_STATE', payload: 'instructions' });
                }
              }}
              className={`w-full max-w-xs px-8 py-4 rounded-full font-bold text-lg tracking-widest hover:scale-105 transition-all duration-300 shadow-xl animate-bounce-subtle
                          ${
                            hasPlayedToday()
                              ? 'bg-[#000080] hover:bg-slate-900 text-white'
                              : 'bg-sky-500 hover:bg-sky-600 text-white'
                          }
                      `}
            >
              {hasPlayedToday() ? (
                <span className="flex flex-col items-center leading-none gap-1">
                  <span>{t('replayChallenge')}</span>
                  <span className="text-[9px] opacity-80 font-medium normal-case tracking-normal">
                    {t('scoreNotSaved')}
                  </span>
                </span>
              ) : (
                t('startQuiz')
              )}
            </button>
          </div>
        </div>
      )}

      {state.gameState === 'instructions' && (
        <div
          className={`absolute inset-0 z-[2000] flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm transition-colors duration-1000
                ${theme === 'dark' ? 'bg-slate-950/80 text-white' : 'bg-slate-50/80 text-slate-900'}
            `}
        >
          <h2 className="text-3xl font-bold mb-6 text-sky-500">{t('howToPlay')}</h2>
          <ul className="text-left space-y-4 text-lg mb-8 max-w-md mx-auto">
            <li className="flex gap-3">
              <span>📍</span>
              <span>{t('instructionsPoint1')}</span>
            </li>
            <li className="flex gap-3">
              <span>🤔</span>
              <span>{t('instructionsPoint2')}</span>
            </li>
            <li className="flex gap-3">
              <span>💡</span>
              <span>{t('instructionsPoint3')}</span>
            </li>
            <li className="flex gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
              <span>⏳</span>
              <span>{t('instructionsPoint4')}</span>
            </li>
          </ul>
          <button
            onClick={() => {
              localStorage.setItem('girify_instructions_seen', 'true');
              if (state.username) {
                setupGame();
              } else {
                dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
              }
            }}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            {state.username ? t('imReady') : t('next')}
          </button>
        </div>
      )}

      {/* DETAILED BREAKDOWN (Only visible on Home/Intro if logged in) */}
      {state.gameState === 'intro' && state.username && (
        <div className="fixed bottom-0 left-0 right-0 z-10 p-4 max-h-[40vh] overflow-y-auto pointer-events-auto bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950">
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 text-center">
                {t('recentActivity') || 'Recent Activity'}
              </h3>
              <div className="space-y-2">
                {(() => {
                  try {
                    const rawHistory = localStorage.getItem('girify_history');
                    const history = rawHistory ? JSON.parse(rawHistory) : [];
                    if (!history || history.length === 0) {
                      return (
                        <p className="text-center text-sm opacity-50 py-2">No games played yet</p>
                      );
                    }
                    const sorted = [...history].sort(
                      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
                    );
                    return sorted.slice(0, 5).map((game, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              game.score >= 1000
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {new Date(game.timestamp || Date.now()).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {game.incomplete ? 'Incomplete' : 'Completed'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-lg text-sky-500">{game.score}</span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">PTS</span>
                        </div>
                      </div>
                    ));
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {state.gameState === 'register' && (
        <RegisterPanel theme={theme} onRegister={handleRegister} />
      )}

      {state.gameState === 'summary' && (
        <div className="absolute inset-0 z-50 pointer-events-auto">
          <SummaryScreen
            score={state.score}
            total={state.quizStreets.length}
            theme={theme}
            username={state.username}
            onRestart={() => setupGame()}
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

export default GameScreen;
