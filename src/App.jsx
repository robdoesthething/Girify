import { useReducer, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapArea from './components/MapArea';
import Quiz from './components/Quiz';
import TopBar from './components/TopBar';
import RegisterPanel from './components/RegisterPanel';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import AboutScreen from './components/AboutScreen';
import ProfileScreen from './components/ProfileScreen';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import rawStreets from './data/streets.json';
import * as turf from '@turf/turf';
import {
  getTodaySeed,
  selectDailyStreets,
  hasPlayedToday,
  markTodayAsPlayed,
} from './utils/dailyChallenge';
import { calculateTimeScore } from './utils/scoring';
import { saveScore } from './utils/leaderboard';
import { getCuriosityByStreets } from './data/curiosities';
import { fetchWikiImage } from './utils/wiki';
import Logo from './components/Logo';
import { gameReducer, initialState } from './reducers/gameReducer';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
// Custom hooks for reusable logic
import { useScoreCalculator, useDailyChallenge } from './hooks';

/**
 * Normalize street names for comparison by removing accents, prefixes, and punctuation.
 * Used to match user input against correct answers.
 *
 * @param {string} str - Street name to normalize
 * @returns {string} Normalized string (lowercase, no accents, no prefixes, alphanumeric only)
 *
 * @example
 * normalize('Carrer de Balmes');
 * // Returns: 'balmes'
 *
 * @example
 * normalize('Avinguda Diagonal');
 * // Returns: 'diagonal'
 */
const normalize = str => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/^(carrer|avinguda|plaça|passeig|passatge|ronda|via|camí)\s+d(e|els|es)?\s+/i, '') // remove prefixes
    .replace(/^(carrer|avinguda|plaça|passeig|passatge|ronda|via|camí)\s+/i, '') // remove prefixes simple
    .replace(/[^a-z0-9]/g, ''); // remove punctuation
};

/**
 * Extract the street type prefix from a street name.
 * Matches common Barcelona street types (Carrer, Avinguda, Plaça, etc.).
 *
 * @param {string} name - Full street name
 * @returns {string} Street prefix (e.g., 'Carrer de', 'Avinguda') or empty string
 *
 * @example
 * getPrefix('Carrer de Balmes');
 * // Returns: 'Carrer de'
 *
 * @example
 * getPrefix('Plaça Catalunya');
 * // Returns: 'Plaça'
 */
const getPrefix = name => {
  if (!name) return '';
  const match = name.match(
    /^(Carrer|Avinguda|Plaça|Passeig|Passatge|Ronda|Via|Camí|Jardins|Parc|Rambla|Travessera)(\s+d(e|els|es|el|ala)|(?=\s))?/i
  );
  return match ? match[0].trim() : '';
};

/**
 * Extract first name from a full name string.
 *
 * @param {string} fullName - Full name (e.g., 'John Doe')
 * @returns {string} First name or empty string
 *
 * @example
 * getFirstName('John Doe');
 * // Returns: 'John'
 */
const getFirstName = fullName => {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
};

/**
 * Get congratulatory message based on score percentage.
 *
 * @param {number} score - Points earned
 * @param {number} maxScore - Maximum possible points
 * @param {Function} t - Translation function
 * @returns {string} Translated congratulations message
 *
 * @example
 * getCongratsMessage(1800, 2000, t);
 * // Returns: t('congratsExcellent') // 90% score
 */
const getCongratsMessage = (score, maxScore, t) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return t('congratsOutstanding');
  if (percentage >= 75) return t('congratsExcellent');
  if (percentage >= 60) return t('congratsGreat');
  if (percentage >= 40) return t('congratsGood');
  return t('congratsKeepPracticing');
};
const AppContent = () => {
  const { deviceMode, theme, t } = useTheme();

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Parse referral code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !localStorage.getItem('girify_referrer')) {
      localStorage.setItem('girify_referrer', ref);
      console.log('[Referral] Stored referrer:', ref);
    }
  }, []);

  // Sync Auto-Advance
  useEffect(() => {
    localStorage.setItem('girify_auto_advance', state.autoAdvance);
  }, [state.autoAdvance]);

  // Actually, to be safe, I'll move handleNext logic (option gen) inside the effect or dispatch directly?
  // Re-using handleNext is better if I can.
  // I'll use a ref for handleNext? No.
  // I will just use handleNext and suppress lint warning or assume it works because feedback changes infrequent.
  // Actually, handleNext IS NOT STABLE. It changes every render.
  // So [state.feedback, state.autoAdvance] might use an OLD handleNext if feedback didn't change but state did?
  // But feedback checks 'transitioning'. It only becomes transitioning once.
  // So it should be fine.

  // WAIT. I cannot call handleNext before it is defined (hoisting?).
  // handleNext is defined with 'const', so it is NOT hoisted.
  // I must place this useEffect AFTER handleNext definition.
  // OR define handleNext with 'function handleNext() {}' (hoisted).
  // Current handleNext is 'const handleNext = ...'.
  // I will check where handleNext is defined. Line 252 (approx).
  // UseEffect is line 73.
  // I MUST move this useEffect to AFTER handleNext definition.

  // I'll skip adding it here and add it later in the file.

  // Memoize valid streets for use in setupGame and handleNext
  const validStreets = useMemo(() => {
    const isValidType = name => {
      if (!name) return false;
      const lower = name.toLowerCase();
      return (
        !lower.includes('autopista') &&
        !lower.includes('autovia') &&
        !lower.includes('b-1') &&
        !lower.includes('b-2')
      );
    };

    const rawValidStreets = rawStreets.filter(
      s => isValidType(s.name) && s.geometry && s.geometry.length > 0
    );
    const uniqueStreetsMap = new Map();
    rawValidStreets.forEach(s => {
      if (!uniqueStreetsMap.has(s.name)) {
        uniqueStreetsMap.set(s.name, s);
      } else {
        const existing = uniqueStreetsMap.get(s.name);
        const currentLength = s.geometry.flat().length;
        const existingLength = existing.geometry.flat().length;
        if (currentLength > existingLength) {
          uniqueStreetsMap.set(s.name, s);
        }
      }
    });
    return Array.from(uniqueStreetsMap.values());
  }, []);

  /**
   * Initialize and start a new game with daily challenge streets.
   * Generates today's street selection using deterministic seeding.
   *
   * @param {string} [freshName] - Optional username to use (defaults to state.username)
   * @returns {void}
   *
   * @example
   * setupGame('JohnDoe');
   * // Starts game with today's 10 streets for user JohnDoe
   */
  function setupGame(freshName) {
    const activeName = freshName || state.username;
    if (!activeName) {
      dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
      return;
    }

    if (validStreets.length === 0) {
      console.error('No valid streets found!');
      alert('Error: No street data available.');
      dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
      return;
    }

    const todaySeed = getTodaySeed();
    const selected = selectDailyStreets(validStreets, todaySeed);

    let initialOptions = [];
    if (selected.length > 0) {
      initialOptions = generateOptionsList(selected[0], validStreets);
    }

    dispatch({
      type: 'START_GAME',
      payload: {
        quizStreets: selected,
        initialOptions: initialOptions,
      },
    });
  }

  /**
   * Generate 4 multiple-choice options for a quiz question.
   * Includes the correct answer plus 3 distractors with matching street type prefix.
   * Falls back to any streets if not enough matching prefixes available.
   *
   * @param {{id: string, name: string}} target - The correct street
   * @param {Array<{id: string, name: string}>} allStreets - Pool of all available streets
   * @returns {Array<{id: string, name: string}>} Array of 4 shuffled options
   *
   * @example
   * generateOptionsList(targetStreet, validStreets);
   * // Returns: [street1, street2, street3, street4] (shuffled, includes target)
   */
  const generateOptionsList = (target, allStreets) => {
    const targetPrefix = getPrefix(target.name);
    let pool = allStreets.filter(s => s.id !== target.id && getPrefix(s.name) === targetPrefix);

    if (pool.length < 3) {
      pool = allStreets.filter(s => s.id !== target.id);
    }

    const distractors = [];
    const usedIds = new Set([target.id]);
    pool.sort(() => 0.5 - Math.random());

    for (const street of pool) {
      if (distractors.length >= 3) break;
      if (!usedIds.has(street.id)) {
        distractors.push(street);
        usedIds.add(street.id);
      }
    }
    const opts = [target, ...distractors].sort(() => 0.5 - Math.random());
    return opts;
  };

  const currentStreet =
    state.gameState === 'playing' ? state.quizStreets[state.currentQuestionIndex] : null;

  // Hint Calculation Effect
  useEffect(() => {
    if (!currentStreet) {
      dispatch({ type: 'SET_HINT_STREETS', payload: [] });
      return;
    }

    const toTurf = lines => lines.map(line => line.map(p => [p[1], p[0]]));
    let hints = [];

    try {
      const currentGeo = turf.multiLineString(toTurf(currentStreet.geometry));

      for (const street of rawStreets) {
        if (street.id === currentStreet.id) continue;
        const lower = street.name.toLowerCase();
        if (lower.includes('autopista') || lower.includes('autovia') || lower.includes('ronda'))
          continue;

        if (street.geometry) {
          const otherGeo = turf.multiLineString(toTurf(street.geometry));
          if (!turf.booleanDisjoint(currentGeo, otherGeo)) {
            hints.push(street);
            if (hints.length >= 3) break;
          }
        }
      }

      if (hints.length < 3) {
        const currentCentroid = turf.centroid(currentGeo);
        const candidates = [];
        for (const street of rawStreets) {
          if (street.id === currentStreet.id) continue;
          if (hints.some(h => h.id === street.id)) continue;
          const lower = street.name.toLowerCase();
          if (lower.includes('autopista') || lower.includes('autovia') || lower.includes('ronda'))
            continue;
          if (street.geometry) {
            const p1 = street.geometry[0][0];
            const otherPoint = turf.point([p1[1], p1[0]]);
            const dist = turf.distance(currentCentroid, otherPoint);
            candidates.push({ street, dist });
          }
        }
        candidates.sort((a, b) => a.dist - b.dist);
        const needed = 3 - hints.length;
        const extra = candidates.slice(0, needed).map(c => c.street);
        hints = [...hints, ...extra];
      }
    } catch (e) {
      console.error('Turf error', e);
    }
    dispatch({ type: 'SET_HINT_STREETS', payload: hints });
  }, [currentStreet]);

  const handleSelectAnswer = selectedStreet => {
    // Dispatch SELECT_ANSWER to ensure UI updates immediately for click feedback
    dispatch({ type: 'SELECT_ANSWER', payload: selectedStreet });
    // Always process answer immediately on click
    // The only difference with autoAdvance is whether we auto-move to next question
    processAnswer(selectedStreet);
  };

  const handleSubmit = () => {
    if (state.selectedAnswer) {
      processAnswer(state.selectedAnswer);
    }
  };

  const processAnswer = selectedStreet => {
    if (state.feedback === 'transitioning') return;

    const isCorrect = selectedStreet.id === currentStreet.id;
    const timeElapsed = state.questionStartTime ? (Date.now() - state.questionStartTime) / 1000 : 0;

    const points = calculateTimeScore(timeElapsed, isCorrect, state.hintsRevealedCount);

    const result = {
      street: currentStreet,
      userAnswer: selectedStreet.name,
      status: isCorrect ? 'correct' : 'failed',
      time: timeElapsed,
      points: points,
      hintsUsed: state.hintsRevealedCount,
    };

    dispatch({
      type: 'ANSWER_SUBMITTED',
      payload: { result, points, selectedStreet },
    });

    // Auto-advance is now handled by useEffect to ensure state consistency
  };

  function handleNext() {
    // Guard: only proceed if we're in transitioning state (answer was submitted)
    // This prevents double-clicks and stale closure issues
    if (state.feedback !== 'transitioning') {
      // console.warn('[handleNext] Blocked - feedback is:', state.feedback);
      return;
    }

    const nextIndex = state.currentQuestionIndex + 1;
    let nextOptions = [];

    // Generate options for the next question if available
    if (nextIndex < state.quizStreets.length) {
      nextOptions = generateOptionsList(state.quizStreets[nextIndex], validStreets);
    }

    // Check if game is over
    if (nextIndex >= state.quizStreets.length) {
      if (state.gameState === 'playing') {
        try {
          if (!hasPlayedToday()) {
            markTodayAsPlayed();
            const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
            const avgTime = state.quizResults.length
              ? (
                  state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
                  state.quizResults.length
                ).toFixed(1)
              : 0;

            const newRecord = {
              date: getTodaySeed(),
              score: state.score,
              avgTime: avgTime,
              timestamp: Date.now(),
            };
            history.push(newRecord);
            localStorage.setItem('girify_history', JSON.stringify(history));

            if (state.username) {
              saveScore(state.username, state.score, newRecord.avgTime).catch(err =>
                console.error('Leaderboard save failed:', err)
              );
            }
          }
        } catch (e) {
          console.error('Error saving', e);
        }
      }
      dispatch({ type: 'NEXT_QUESTION', payload: {} });
    } else {
      const nextStreet = state.quizStreets[nextIndex];
      const nextOptions = generateOptionsList(nextStreet, validStreets);

      dispatch({
        type: 'NEXT_QUESTION',
        payload: { options: nextOptions },
      });
    }
  }

  const handleRegister = name => {
    localStorage.setItem('girify_username', name);
    dispatch({ type: 'SET_USERNAME', payload: name });
    setupGame(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('girify_username');
    dispatch({ type: 'LOGOUT' });
  };

  const handleOpenPage = page => {
    dispatch({ type: 'SET_ACTIVE_PAGE', payload: page });
  };

  // Firebase Auth State Listener (Moved to bottom to fix hoisting)
  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        console.log('[Auth] User authenticated:', user.email, user.displayName);
        // User is signed in
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';

        // Check if we already have this user set
        const currentUsername = localStorage.getItem('girify_username');
        if (currentUsername !== displayName) {
          console.log('[Auth] Setting username to:', displayName);
          localStorage.setItem('girify_username', displayName);
          dispatch({ type: 'SET_USERNAME', payload: displayName });

          // Only setup game if we're in register state
          if (state.gameState === 'register') {
            setupGame(displayName);
          }
        }
      } else {
        console.log('[Auth] User signed out');
        // User is signed out - only clear if we're not in guest mode
        const currentUsername = state.username;
        if (currentUsername && auth.currentUser === null) {
          // This means user was logged out from Firebase
          // We should respect that and clear local state
          console.log('[Auth] Clearing user state due to sign out');
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[Auth] Cleaning up auth state listener');
      unsubscribe();
    };
  }, [state.gameState]);

  // Handle Auto-Advance (Moved to bottom to fix hoisting)
  useEffect(() => {
    let timeoutId;
    if (state.feedback === 'transitioning' && state.autoAdvance) {
      timeoutId = setTimeout(() => {
        handleNext();
      }, 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [state.feedback, state.autoAdvance]);

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
            bg-slate-50 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
        `}
    >
      <TopBar onOpenPage={handleOpenPage} />

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
                    onSelect={handleSelectAnswer}
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

                {/* Show Next button after answer is submitted (feedback=transitioning) */}
                {state.feedback === 'transitioning' && !state.autoAdvance && (
                  <Quiz.NextButton
                    onNext={handleNext}
                    isLastQuestion={state.currentQuestionIndex >= state.quizStreets.length - 1}
                    isSubmit={false}
                    feedback={state.feedback}
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

      <AnimatePresence>
        {state.activePage === 'leaderboard' && (
          <LeaderboardScreen
            key="leaderboard"
            onClose={() => handleOpenPage(null)}
            currentUser={state.username}
          />
        )}
        {state.activePage === 'settings' && (
          <SettingsScreen
            key="settings"
            onClose={() => handleOpenPage(null)}
            onLogout={handleLogout}
            autoAdvance={state.autoAdvance}
            setAutoAdvance={val => dispatch({ type: 'SET_AUTO_ADVANCE', payload: val })}
          />
        )}
        {state.activePage === 'about' && (
          <AboutScreen key="about" onClose={() => handleOpenPage(null)} />
        )}
        {state.activePage === 'profile' && (
          <ProfileScreen
            key="profile"
            onClose={() => handleOpenPage(null)}
            username={state.username}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// SummaryScreen remains largely unchanged but ensures it receives props
const SummaryScreen = ({
  score,
  total,
  theme,
  username,
  onRestart,
  quizResults,
  quizStreets,
  t,
}) => {
  const [view, setView] = useState('summary');
  const [curiosityRevealed, setCuriosityRevealed] = useState(false);

  const totalTime = quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0);
  const avgTime = quizResults.length ? (totalTime / quizResults.length).toFixed(1) : 0;
  const maxPossibleScore = total * 100;
  const curiosity = useMemo(() => getCuriosityByStreets(quizStreets), [quizStreets]);
  const [displayImage, setDisplayImage] = useState(curiosity.image);

  useEffect(() => {
    let active = true;
    const loadDynamicImage = async () => {
      if (curiosity.title) {
        const url = await fetchWikiImage(curiosity.title);
        if (active && url) {
          setDisplayImage(url);
        }
      }
    };
    loadDynamicImage();
    return () => {
      active = false;
    };
  }, [curiosity]);

  const history = JSON.parse(localStorage.getItem('girify_history') || '[]');

  const handleShare = async () => {
    // Include referral code in share URL
    // Use prod URL if available, otherwise fallback
    const baseUrl = 'https://girify.vercel.app'; // Updated to Prod URL
    const refCode = username ? username.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const shareUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl;
    const text = `🌆 Girify Daily Challenge:\nScore: ${score}/${maxPossibleScore}\n\nCan you beat me? Play here: ${shareUrl} #Girify #Barcelona`;

    const performShare = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Girify - Barcelona Street Quiz',
            text: text,
          });
          return true;
        } else {
          await navigator.clipboard.writeText(text);
          alert('Results copied to clipboard!');
          return true;
        }
      } catch (err) {
        return false;
      }
    };

    const shared = await performShare();
    if (shared) setCuriosityRevealed(true);
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto
            ${theme === 'dark' ? 'bg-slate-900/95 text-white' : 'bg-slate-50/95 text-slate-800'}`}
    >
      {view === 'summary' && !curiosityRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-md"
        >
          <div className="mb-1">
            <span className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-full text-[10px] uppercase font-bold tracking-widest border border-sky-500/20">
              {t('dailyChallengeComplete')}
            </span>
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight">
            {getCongratsMessage(score, maxPossibleScore, t).replace(
              '!',
              `, ${getFirstName(username)}!`
            )}
          </h2>

          <div
            className={`w-full p-4 rounded-2xl border mb-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}
          >
            <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold block">
              {t('yourScore')}
            </span>
            <span className="text-3xl font-black text-sky-500">{score}</span>
            <span className="text-xs text-slate-400 ml-1">/ {maxPossibleScore}</span>
          </div>

          <div className="w-full mb-4">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
              {t('questionBreakdown')}
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {quizResults.map((result, idx) => {
                const isCorrect = result.status === 'correct';
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all
                      ${
                        isCorrect
                          ? theme === 'dark'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                            : 'bg-sky-500/10 border-sky-500 text-sky-600'
                          : theme === 'dark'
                            ? 'bg-slate-700/50 border-slate-600 text-slate-400'
                            : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}
                  >
                    <span className="text-[8px] font-bold opacity-60">Q{idx + 1}</span>
                    <span className="text-sm font-black">{Math.round(result.points)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`w-full p-4 rounded-2xl border mb-3 ${theme === 'dark' ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}
          >
            <p className="text-sky-500 font-bold mb-1 text-sm">{t('cityCuriosityUnlocked')}</p>
            <p className="text-[10px] mb-3 text-slate-500 font-medium">{t('shareToReveal')}</p>
            <button
              onClick={handleShare}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {t('shareAndReveal')}
            </button>
          </div>

          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => setView('rankings')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}
            >
              Rankings
            </button>
          </div>
        </motion.div>
      )}

      {view === 'rankings' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center w-full max-w-sm"
        >
          <h2 className="text-2xl font-black mb-4">Rankings</h2>
          <div className="w-full space-y-2 mb-8">
            {history
              .slice(-3)
              .reverse()
              .map(record => (
                <div key={record.timestamp} className="p-3 border rounded-xl flex justify-between">
                  <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                  <span className="font-bold">{record.score}</span>
                </div>
              ))}
          </div>
          <button onClick={() => setView('summary')} className="px-6 py-2 bg-slate-200 rounded-lg">
            Back
          </button>
        </motion.div>
      )}

      {view === 'breakdown' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center w-full max-w-md h-full pb-20"
        >
          <h2 className="text-2xl font-black mb-4">Breakdown</h2>
          <div className="w-full flex-1 overflow-y-auto space-y-2">
            {quizResults.map((r, i) => (
              <div key={i} className="p-2 border rounded text-left">
                <div className="font-bold">{r.street.name}</div>
                <div
                  className={`text-xs ${r.status === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {r.status}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setView('summary')}
            className="px-6 py-2 bg-slate-200 rounded-lg mt-4"
          >
            Back
          </button>
        </motion.div>
      )}

      {curiosityRevealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md"
        >
          <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em]">
            City Curiosity
          </h2>
          <h3 className="text-2xl font-black mb-4 text-slate-800 dark:text-white">
            {curiosity.title}
          </h3>

          <div className="rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl border">
            <img
              src={displayImage}
              alt="Barcelona"
              className="w-full h-56 object-cover transition-opacity duration-500"
            />
            <div className="p-8">
              <p
                className={`text-xl leading-relaxed font-bold italic ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}
              >
                "{curiosity.fact}"
              </p>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full max-w-sm py-5 bg-sky-500 hover:bg-sky-600 text-white rounded-[2rem] shadow-xl font-black text-xl transition-all transform hover:scale-105"
          >
            PLAY AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
