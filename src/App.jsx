import { useReducer, useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TopBar from './components/TopBar';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import AboutScreen from './components/AboutScreen';
import ProfileScreen from './components/ProfileScreen';
import FriendsScreen from './components/FriendsScreen';
import PublicProfileScreen from './components/PublicProfileScreen';
import GameScreen from './components/GameScreen';
import ShopScreen from './components/ShopScreen';

// ... inside Routes

import { ThemeProvider, useTheme } from './context/ThemeContext';
import rawStreets from './data/streets.json';
import * as turf from '@turf/turf';
import {
  getTodaySeed,
  selectDailyStreets,
  hasPlayedToday,
  markTodayAsPlayed,
  selectDistractors,
  shuffleOptions,
} from './utils/dailyChallenge';
import { calculateTimeScore } from './utils/scoring';
import { saveScore } from './utils/leaderboard';
import {
  ensureUserProfile,
  migrateUser,
  hasDailyReferral,
  healMigration,
  updateUserProfile,
} from './utils/social';
import { claimDailyLoginBonus, awardChallengeBonus } from './utils/giuros';
import { gameReducer, initialState } from './reducers/gameReducer';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';

import FeedbackModal from './components/FeedbackModal';
import AdminRoute from './components/AdminRoute';
import AdminPanel from './components/AdminPanel';

const AppRoutes = () => {
  const { deviceMode, theme, t } = useTheme();
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const location = useLocation();
  const navigate = useNavigate();

  // Feedback Modal State
  const [showFeedback, setShowFeedback] = useState(false);

  // Parse referral code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !localStorage.getItem('girify_referrer')) {
      localStorage.setItem('girify_referrer', ref);
    }
  }, []);

  // Sync Auto-Advance
  useEffect(() => {
    localStorage.setItem('girify_auto_advance', state.autoAdvance);
  }, [state.autoAdvance]);

  // Memoize valid streets
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

  // Generate options helper
  const generateOptionsList = (target, allStreets, questionIndex) => {
    const todaySeed = getTodaySeed();
    const questionSeed = todaySeed + questionIndex * 100;
    const distractors = selectDistractors(allStreets, target, questionSeed);
    const opts = [target, ...distractors];
    return shuffleOptions(opts, questionSeed + 50);
  };

  /**
   * Setup Game
   */
  function setupGame(freshName) {
    const activeName = freshName || state.username;
    if (!activeName) {
      dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
      return;
    }

    if (validStreets.length === 0) {
      console.error('No valid streets found!');
      dispatch({ type: 'SET_GAME_STATE', payload: 'intro' });
      return;
    }

    const todaySeed = getTodaySeed();
    const selected = selectDailyStreets(validStreets, todaySeed);

    let initialOptions = [];
    if (selected.length > 0) {
      initialOptions = generateOptionsList(selected[0], validStreets, 0);
    }

    dispatch({
      type: 'START_GAME',
      payload: {
        quizStreets: selected,
        initialOptions: initialOptions,
      },
    });
  }

  const currentStreet =
    state.gameState === 'playing' ? state.quizStreets[state.currentQuestionIndex] : null;

  // Hint Calculation
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

  // Handlers
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
  };

  const handleSelectAnswer = selectedStreet => {
    dispatch({ type: 'SELECT_ANSWER', payload: selectedStreet });
    processAnswer(selectedStreet);
  };

  const handleNext = () => {
    if (state.feedback !== 'transitioning') return;

    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= state.quizStreets.length) {
      if (state.gameState === 'playing') {
        try {
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
            username: state.username,
          };
          history.push(newRecord);
          localStorage.setItem('girify_history', JSON.stringify(history));

          if (state.username) {
            // Check for referral bonus (allows retry)
            hasDailyReferral(state.username).then(isBonus => {
              saveScore(state.username, state.score, newRecord.avgTime, isBonus);
            });

            // Award giuros for completing the daily challenge
            const historyForStreak = JSON.parse(localStorage.getItem('girify_history') || '[]');
            const streak = historyForStreak.filter((h, i, arr) => {
              // Simple streak calculation for bonus
              return arr.findIndex(x => x.date === h.date) === i;
            }).length;
            awardChallengeBonus(state.username, streak).then(result => {
              // eslint-disable-next-line no-console
              console.log(`[Giuros] Challenge bonus: +${result.bonus}`);
            });

            // FEEDBACK CHECK: Check if we should ask for feedback (weekly)
            const lastFeedback = localStorage.getItem('girify_last_feedback');
            const now = Date.now();
            // 7 days = 7 * 24 * 60 * 60 * 1000 = 604800000
            if (!lastFeedback || now - parseInt(lastFeedback) > 604800000) {
              setTimeout(() => setShowFeedback(true), 2000); // Show after short delay
            }
          }
        } catch (e) {
          console.error('[Game] Error saving game:', e);
        }
      }
      dispatch({ type: 'NEXT_QUESTION', payload: {} });
    } else {
      const nextStreet = state.quizStreets[nextIndex];
      const nextOptions = generateOptionsList(nextStreet, validStreets, nextIndex);
      dispatch({
        type: 'NEXT_QUESTION',
        payload: { options: nextOptions },
      });
    }
  };

  const handleRegister = name => {
    localStorage.setItem('girify_username', name);
    dispatch({ type: 'SET_USERNAME', payload: name });
    setupGame(name);
  };

  const handleLogout = () => {
    signOut(auth).catch(err => console.error('Sign out error', err));
    localStorage.removeItem('girify_username');
    localStorage.removeItem('lastPlayedDate');
    dispatch({ type: 'LOGOUT' });
    navigate('/'); // Go home on logout
  };

  const handleOpenPage = page => {
    // Check if user is in the middle of a game
    if (state.gameState === 'playing' && state.currentQuestionIndex < state.quizStreets.length) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(
        t('exitGameWarning') ||
          'You are in the middle of a game. Progress will be lost and your score will be calculated based on current answers. Exit anyway?'
      );
      if (!confirmed) return; // Don't navigate if user cancels

      // User confirmed - save current progress before exiting
      try {
        const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
        const avgTime = state.quizResults.length
          ? (
              state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
              state.quizResults.length
            ).toFixed(1)
          : 0;

        const partialRecord = {
          date: getTodaySeed(),
          score: state.score,
          avgTime: avgTime,
          timestamp: Date.now(),
          username: state.username,
          incomplete: true, // Mark as incomplete
        };
        history.push(partialRecord);
        localStorage.setItem('girify_history', JSON.stringify(history));

        if (state.username) {
          hasDailyReferral(state.username).then(isBonus => {
            saveScore(state.username, state.score, partialRecord.avgTime, isBonus);
          });
        }
      } catch (e) {
        console.error('[Game] Error saving partial progress:', e);
      }
    }

    // If null/undefined, go home. Else go to page.
    navigate(page ? `/${page}` : '/');
  };

  // Feedback close handler
  const handleFeedbackClose = () => {
    setShowFeedback(false);
    localStorage.setItem('girify_last_feedback', Date.now().toString());
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        let displayName = user.displayName || user.email?.split('@')[0] || 'User';

        // MIGRATION 2.0: Ensure handle format (@Name1234)
        // Previous format was Name#1234. New format @Name1234.
        const oldFormatRegex = /.*#\d{4}$/;
        const newFormatRegex = /^@[a-zA-Z0-9]+$/;

        let shouldMigrateHandle = false;
        let newHandle = displayName;

        if (oldFormatRegex.test(displayName)) {
          // Convert Name#1234 -> @Name1234
          newHandle = '@' + displayName.replace('#', '');
          shouldMigrateHandle = true;
        } else if (!newFormatRegex.test(displayName)) {
          // Generate new handle if neither
          const randomId = Math.floor(1000 + Math.random() * 9000);
          const sanitizedName = displayName.replace(/[^a-zA-Z0-9]/g, '');
          newHandle = `@${sanitizedName}${randomId}`;
          shouldMigrateHandle = true;
        }

        if (shouldMigrateHandle) {
          try {
            // eslint-disable-next-line no-console
            console.log(`[Migration] Update handle: ${displayName} -> ${newHandle}`);

            // 1. Update Firebase Auth Profile
            await updateProfile(user, { displayName: newHandle });

            // 2. DATA MIGRATION: Copy old profile data to new handle
            await migrateUser(displayName, newHandle);

            displayName = newHandle;
            // eslint-disable-next-line no-console
            console.log('[Migration] Success! New handle:', displayName);
          } catch (e) {
            console.error('[Migration] Failed to migrate user to handle:', e);
          }
        }

        // Ensure Firestore profile matches
        ensureUserProfile(displayName, user.uid)
          .then(profile => {
            // Self-heal any broken migration links
            healMigration(displayName).catch(err => console.error(err));

            // Claim daily login bonus (giuros)
            claimDailyLoginBonus(displayName).then(result => {
              if (result.claimed) {
                // eslint-disable-next-line no-console
                console.log(`[Giuros] Daily login bonus claimed: +${result.bonus}`);
              }
            });

            // MIGRATION: Registry Date Backfill
            // If profile doesn't have a valid joinedAt, OR we want to backfill from history if older
            let earliestDate = null;

            // Check local history for earliest game
            try {
              const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
              if (history.length > 0) {
                // Sort by timestamp asc
                const sorted = [...history].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                if (sorted[0].timestamp) {
                  earliestDate = new Date(sorted[0].timestamp);
                }
              }
            } catch (e) {
              console.warn('History parse error', e);
            }

            // If we found an earlier date than what's stored (or nothing stored), use it
            // Logic: If profile has date X, and history has date Y < X, update to Y.
            let profileDate = null;
            if (profile && profile.joinedAt) {
              profileDate = profile.joinedAt.toDate
                ? profile.joinedAt.toDate()
                : new Date(profile.joinedAt.seconds * 1000);
            }

            if (earliestDate) {
              if (!profileDate || earliestDate < profileDate) {
                // eslint-disable-next-line no-console
                console.log('[Migration] Backfilling registry date from history:', earliestDate);
                // Update firestore profile with new date? ensureUserProfile doesn't update if exists usually.
                // We might need a specific update call or rely on local storage for display.
                // Ideally we update firestore.
                updateUserProfile(displayName, { joinedAt: earliestDate }).catch(e =>
                  console.error(e)
                );

                localStorage.setItem('girify_joined', earliestDate.toLocaleDateString());
              }
            }

            // Sync joined date to local storage for display
            if (!localStorage.getItem('girify_joined')) {
              if (profileDate) {
                localStorage.setItem('girify_joined', profileDate.toLocaleDateString());
              } else {
                // Fallback to today if truly new and no history
                localStorage.setItem('girify_joined', new Date().toLocaleDateString());
              }
            }
          })
          .catch(e => console.error(e));

        const currentUsername = localStorage.getItem('girify_username');
        if (currentUsername !== displayName) {
          localStorage.setItem('girify_username', displayName);
          dispatch({ type: 'SET_USERNAME', payload: displayName });
          if (state.gameState === 'register') {
            setupGame(displayName);
          }
        }
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameState]);

  // Auto-Advance
  useEffect(() => {
    let timeoutId;
    if (state.feedback === 'transitioning' && state.autoAdvance) {
      timeoutId = setTimeout(() => {
        handleNext();
      }, 1000);
    }
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedback, state.autoAdvance]);

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
            bg-slate-50 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
        `}
    >
      <TopBar onOpenPage={handleOpenPage} />

      {/* Global Feedback Modal */}
      <AnimatePresence>
        {showFeedback && <FeedbackModal username={state.username} onClose={handleFeedbackClose} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <GameScreen
                state={state}
                dispatch={dispatch}
                theme={theme}
                deviceMode={deviceMode}
                t={t}
                currentStreet={currentStreet}
                handleSelectAnswer={handleSelectAnswer}
                handleNext={handleNext}
                processAnswer={processAnswer}
                setupGame={setupGame}
                handleRegister={handleRegister}
                hasPlayedToday={hasPlayedToday}
              />
            }
          />
          <Route
            path="/leaderboard"
            element={
              <LeaderboardScreen
                onClose={() => handleOpenPage(null)}
                currentUser={state.username}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsScreen
                onClose={() => handleOpenPage(null)}
                onLogout={handleLogout}
                autoAdvance={state.autoAdvance}
                setAutoAdvance={val => dispatch({ type: 'SET_AUTO_ADVANCE', payload: val })}
                username={state.username}
              />
            }
          />
          <Route path="/about" element={<AboutScreen onClose={() => handleOpenPage(null)} />} />
          <Route
            path="/profile"
            element={
              <ProfileScreen onClose={() => handleOpenPage(null)} username={state.username} />
            }
          />
          <Route
            path="/user/:username"
            element={<PublicProfileScreen currentUser={state.username} />}
          />
          <Route
            path="/friends"
            element={
              <FriendsScreen onClose={() => handleOpenPage(null)} username={state.username} />
            }
          />
          <Route path="/shop" element={<ShopScreen username={state.username} />} />

          {/* Admin Route */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
