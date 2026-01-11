import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import MapArea from './MapArea';
import Quiz from './Quiz';
import RegisterPanel from './RegisterPanel';
import SummaryScreen from './SummaryScreen';
import Logo from './Logo';
import OnboardingTour from './OnboardingTour';
import LandingPage from './LandingPage';

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
    const completed = localStorage.getItem('girify_onboarding_completed');
    return !completed && !state.username;
  });

  const handleManualNext = () => {
    if (state.feedback === 'selected') {
      processAnswer(state.selectedAnswer);
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else if (state.feedback === 'transitioning') {
      handleNext();
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col w-full h-full relative overflow-hidden font-inter ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
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
            currentStreet={currentStreet}
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
                      ? 'w-full h-[45%] order-2 border-t rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]'
                      : 'w-[400px] lg:w-[450px] h-full order-2'
                  }
               `}
          >
            <Quiz>
              <Quiz.Container keyProp={state.currentQuestionIndex}>
                <Quiz.Content>
                  <Quiz.Options
                    options={state.options}
                    onSelect={street => {
                      if (state.feedback === 'transitioning') return;
                      if (state.autoAdvance) handleSelectAnswer(street);
                      else dispatch({ type: 'SELECT_ANSWER', payload: street });
                    }}
                    selectedAnswer={state.selectedAnswer}
                    feedback={state.feedback}
                    correctName={currentStreet?.name}
                    autoAdvance={state.autoAdvance}
                    disabled={state.isInputLocked}
                  />
                </Quiz.Content>

                <Quiz.Hints
                  hintStreets={state.hintStreets}
                  hintsRevealed={state.hintsRevealedCount}
                  onReveal={() => dispatch({ type: 'REVEAL_HINT' })}
                  feedback={state.feedback}
                />

                {!state.autoAdvance && (
                  <Quiz.NextButton
                    onNext={handleManualNext}
                    isLastQuestion={state.currentQuestionIndex >= state.quizStreets.length - 1}
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

      {/* For logged-in users in intro state: show map with play overlay */}
      {state.gameState === 'intro' && state.username && (
        <>
          {/* Map Background */}
          {/* Map Background Removed - reusing underlay */}

          {/* Translucent Play Overlay */}
          <div
            className={`absolute inset-0 z-[500] flex flex-col items-center justify-center backdrop-blur-sm ${theme === 'dark' ? 'bg-slate-950/70' : 'bg-white/70'}`}
          >
            <div className="text-center animate-fade-in-up">
              <div className="mb-6 flex justify-center">
                <Logo className="h-16 w-auto" />
              </div>
              <h2
                className={`text-3xl md:text-5xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}
              >
                PROVE YOU ARE A LOCAL
              </h2>
              <p
                className={`text-lg mb-10 font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
              >
                Welcome back, {state.username.replace('@', '')}!
              </p>
              <button
                onClick={() => setupGame()}
                className={`px-12 py-5 rounded-full text-white shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center mx-auto ring-4 ${
                  hasPlayedToday()
                    ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/30 ring-[#000080]/20'
                    : 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30 ring-sky-500/20'
                }`}
              >
                <span className="font-black text-xl tracking-wider">
                  {hasPlayedToday() ? t('replay') || 'Replay' : t('play') || 'Play'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* For non-logged users: show full LandingPage */}
      {state.gameState === 'intro' && !state.username && (
        <LandingPage
          theme={theme}
          hasPlayedToday={hasPlayedToday()}
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

      {state.gameState === 'instructions' && (
        <div
          className={`absolute inset-0 z-[2000] flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-1000 ${theme === 'dark' ? 'bg-slate-950/80 text-white' : 'bg-slate-50/80 text-slate-900'}`}
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
            onClick={() => {
              localStorage.setItem('girify_instructions_seen', 'true');
              if (state.username) setupGame();
              else dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
            }}
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 font-bold text-xl transition-all transform hover:scale-105"
          >
            {state.username ? t('imReady') : t('next')}
          </button>
        </div>
      )}

      {state.gameState === 'register' && (
        <RegisterPanel theme={theme} onRegister={handleRegister} initialMode={state.registerMode} />
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
