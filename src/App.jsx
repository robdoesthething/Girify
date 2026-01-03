import { useReducer, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TopBar from './components/TopBar';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import AboutScreen from './components/AboutScreen';
import ProfileScreen from './components/ProfileScreen';
import FriendsScreen from './components/FriendsScreen';
import GameScreen from './components/GameScreen';
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
import { ensureUserProfile } from './utils/social';
import { gameReducer, initialState } from './reducers/gameReducer';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';

const AppRoutes = () => {
  const { deviceMode, theme, t } = useTheme();
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const location = useLocation();
  const navigate = useNavigate();

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
            saveScore(state.username, state.score, newRecord.avgTime);
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
    // If null/undefined, go home. Else go to page.
    navigate(page ? `/${page}` : '/');
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        let displayName = user.displayName || user.email?.split('@')[0] || 'User';

        // MIGRATION: Ensure handle format (Name#1234)
        if (!/.*#\d{4}$/.test(displayName)) {
          try {
            console.log('[Migration] Promoting user to Handle format...');
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const sanitizedName = displayName.replace(/[^a-zA-Z0-9]/g, '');
            const handle = `${sanitizedName}#${randomId}`;

            // 1. Update Firebase Auth Profile
            await updateProfile(user, { displayName: handle });

            // 2. Ensure Firestore User Profile exists with correct data
            // We pass the OLD displayName as realName to preserve it privately
            await ensureUserProfile(handle, { realName: displayName });

            displayName = handle;
            console.log('[Migration] Success! New handle:', displayName);
          } catch (e) {
            console.error('[Migration] Failed to migrate user to handle:', e);
          }
        } else {
          // Even if handle exists, ensure Firestore profile matches
          ensureUserProfile(displayName).catch(e => console.error(e));
        }

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
            path="/friends"
            element={
              <FriendsScreen onClose={() => handleOpenPage(null)} username={state.username} />
            }
          />
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
