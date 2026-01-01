import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapArea from './components/MapArea';
import QuizInterface from './components/QuizInterface';
import TopBar from './components/TopBar';
import RegisterPanel from './components/RegisterPanel';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import AboutScreen from './components/AboutScreen';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import rawStreets from './data/streets.json';
import * as turf from '@turf/turf';
import { getTodaySeed, selectDailyStreets, hasPlayedToday, markTodayAsPlayed, getTimeUntilNext } from './utils/dailyChallenge';
import { calculateTimeScore } from './utils/scoring';
import { saveScore } from './utils/leaderboard';
import { getCuriosityByStreets } from './data/curiosities';
import { fetchWikiImage } from './utils/wiki';
import logoImage from './assets/girify-logo.png';

// Helper to normalize strings for comparison
// Helper to normalize strings for comparison
const normalize = (str) => {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/^(carrer|avinguda|plaça|passeig|passatge|ronda|via|camí)\s+d(e|els|es)?\s+/i, "") // remove prefixes
    .replace(/^(carrer|avinguda|plaça|passeig|passatge|ronda|via|camí)\s+/i, "") // remove prefixes simple
    .replace(/[^a-z0-9]/g, ""); // remove punctuation
};

// Improved prefix extraction
const getPrefix = (name) => {
  if (!name) return '';
  // Match common prefixes, ensuring we capture the full type including "de", "d'", etc.
  // Case insensitive, matches start of string.
  const match = name.match(/^(Carrer|Avinguda|Plaça|Passeig|Passatge|Ronda|Via|Camí|Jardins|Parc|Rambla|Travessera)(\s+d(e|els|es|el|ala)|(?=\s))?/i);
  return match ? match[0].trim() : '';
};

const checkAnswer = (input, streetName) => {
  const normInput = normalize(input);
  const normTarget = normalize(streetName);
  // Compare core names by removing prefixes
  const p1 = getPrefix(input);
  const p2 = getPrefix(streetName);

  const coreInput = p1 ? normInput.replace(normalize(p1), '') : normInput;
  const coreTarget = p2 ? normTarget.replace(normalize(p2), '') : normTarget;

  return coreInput === coreTarget || normInput === normTarget;
}

// Extract first name from full name
const getFirstName = (fullName) => {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
}

// Get custom congrats message based on score
const getCongratsMessage = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return "Outstanding! 🌟";
  if (percentage >= 75) return "Excellent work! 🎉";
  if (percentage >= 60) return "Great job! 👏";
  if (percentage >= 40) return "Good effort! 💪";
  return "Keep practicing! 📚";
}

const AppContent = () => {
  const { deviceMode, theme, zoom } = useTheme();
  const [gameState, setGameState] = useState('intro');
  const [username, setUsername] = useState(localStorage.getItem('girify_username') || '');
  const [quizStreets, setQuizStreets] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('idle');
  const [options, setOptions] = useState([]);

  // Auto-Advance State (Lifted from local storage)
  const [autoAdvance, setAutoAdvance] = useState(() => {
    return localStorage.getItem('girify_auto_advance') !== 'false';
  });

  // Sync Auto-Advance to LocalStorage
  useEffect(() => {
    localStorage.setItem('girify_auto_advance', autoAdvance);
  }, [autoAdvance]);

  // Lifted State: Hints
  const [hintStreets, setHintStreets] = useState([]);
  const [hintsRevealedCount, setHintsRevealedCount] = useState(0);

  // Stats
  const [startTime, setStartTime] = useState(Date.now());
  const [quizResults, setQuizResults] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const setupGame = (freshName) => {
    // Check for registration first
    const activeName = freshName || username;
    if (!activeName) {
      setGameState('register');
      return;
    }

    const isValidType = (name) => {
      if (!name) return false;
      const lower = name.toLowerCase();
      // Filter out non-street entities if needed, though raw filter does most work
      return !lower.includes("autopista") && !lower.includes("autovia") && !lower.includes("b-1") && !lower.includes("b-2");
    };

    const rawValidStreets = rawStreets.filter(s => isValidType(s.name) && s.geometry && s.geometry.length > 0);

    const uniqueStreetsMap = new Map();
    rawValidStreets.forEach(s => {
      // Deduplicate: If name exists, keep the one with MORE geometry points (likely the main segment)
      if (!uniqueStreetsMap.has(s.name)) {
        uniqueStreetsMap.set(s.name, s);
      } else {
        const existing = uniqueStreetsMap.get(s.name);
        // Calculate complexity/length roughly by number of segments/points
        const currentLength = s.geometry.flat().length;
        const existingLength = existing.geometry.flat().length;

        if (currentLength > existingLength) {
          uniqueStreetsMap.set(s.name, s);
        }
      }
    });
    const validStreets = Array.from(uniqueStreetsMap.values());

    if (validStreets.length === 0) {
      console.error("No valid streets found!");
      alert("Error: No street data available. Please check the data source.");
      setGameState('intro');
      return;
    }

    const todaySeed = getTodaySeed();
    const selected = selectDailyStreets(validStreets, todaySeed);

    setQuizStreets(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setFeedback('idle');
    setGameState('playing');
    setHintsRevealedCount(0);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setQuizResults([]);
    if (selected.length > 0) {
      generateOptions(selected[0], validStreets);
    }
  };

  const generateOptions = (target, allStreets) => {
    const targetPrefix = getPrefix(target.name);

    // Filter distractors: must have same prefix and not be the target
    let potentialDistractors = allStreets.filter(s =>
      s.id !== target.id &&
      getPrefix(s.name) === targetPrefix
    );

    // If we don't have enough strict matches, we might just have to fallback to randoms
    // But per user request, we want SAME prefix.
    // Ideally, the question selection itself should ensure enough distractors exist, but here we handle the generated set.

    let pool = potentialDistractors;
    if (pool.length < 3) {
      // Fallback: relax prefix requirement if absolutely necessary, but prioritize strictness.
      // Or, just pick randoms but this violates the "SAME prefix" rule. 
      // Better strategy: The game selects questions. If a question is "Via Augusta", we need "Via ..." distractors.
      // If none exist, it looks broken. 
      // We will fill with *any* street if strict match fails, but this should be rare for common prefixes.
      pool = allStreets.filter(s => s.id !== target.id);
    }

    // Pick 3 random distractors from the pool
    const distractors = [];
    const usedIds = new Set([target.id]);

    // Shuffle pool first to pick randoms
    pool.sort(() => 0.5 - Math.random());

    for (const street of pool) {
      if (distractors.length >= 3) break;
      if (!usedIds.has(street.id)) {
        distractors.push(street);
        usedIds.add(street.id);
      }
    }

    // Shuffle final options
    const opts = [target, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(opts);
  };

  const currentStreet = gameState === 'playing' ? quizStreets[currentQuestionIndex] : null;

  // Hint Calculation Effect
  useEffect(() => {
    setHintsRevealedCount(0); // Reset on new street
    if (!currentStreet) {
      setHintStreets([]);
      return;
    }

    const toTurf = (lines) => lines.map(line => line.map(p => [p[1], p[0]]));
    let hints = [];

    try {
      const currentGeo = turf.multiLineString(toTurf(currentStreet.geometry));

      // Strategy 1: Intersections
      for (const street of rawStreets) {
        if (street.id === currentStreet.id) continue;
        const lower = street.name.toLowerCase();
        if (lower.includes("autopista") || lower.includes("autovia") || lower.includes("ronda")) continue;

        if (street.geometry) {
          const otherGeo = turf.multiLineString(toTurf(street.geometry));
          if (!turf.booleanDisjoint(currentGeo, otherGeo)) {
            hints.push(street);
            if (hints.length >= 3) break;
          }
        }
      }

      // Strategy 2: Fallback (Proximity) if < 3 hints
      if (hints.length < 3) {
        const currentCentroid = turf.centroid(currentGeo);
        const candidates = [];

        for (const street of rawStreets) {
          if (street.id === currentStreet.id) continue;
          if (hints.some(h => h.id === street.id)) continue; // Already added

          const lower = street.name.toLowerCase();
          if (lower.includes("autopista") || lower.includes("autovia") || lower.includes("ronda")) continue;

          if (street.geometry) {
            // Approximate distance using first point or centroid (expensive?)
            // Optimized: use first point of first segment
            const p1 = street.geometry[0][0];
            const otherPoint = turf.point([p1[1], p1[0]]); // Swap for GeoJSON
            const dist = turf.distance(currentCentroid, otherPoint);
            candidates.push({ street, dist });
          }
        }

        // Sort by distance and take what we need
        candidates.sort((a, b) => a.dist - b.dist);
        const needed = 3 - hints.length;
        const extra = candidates.slice(0, needed).map(c => c.street);
        hints = [...hints, ...extra];
      }

    } catch (e) {
      console.error("Turf error", e);
    }

    setHintStreets(hints);
  }, [currentStreet]);

  const handleSelectAnswer = (selectedStreet) => {
    // If we are already transitioning, ignore clicks (simple debounce)
    if (feedback === 'transitioning') return;

    const isCorrect = selectedStreet.id === currentStreet.id;
    // If answer before timer starts (during fly animation), count as 0s or handle gracefully
    const timeElapsed = questionStartTime
      ? (Date.now() - questionStartTime) / 1000
      : 0; // Instant answer!

    // Calculate time-based score (0-100 points) with hint penalty
    const points = calculateTimeScore(timeElapsed, isCorrect, hintsRevealedCount);

    const result = {
      street: currentStreet,
      userAnswer: selectedStreet.name, // Store user answer for summary
      status: isCorrect ? 'correct' : 'failed',
      time: timeElapsed,
      points: points,
      hintsUsed: hintsRevealedCount
    };

    setQuizResults(prev => [...prev, result]);

    // Add points to total score
    setScore(s => s + points);

    // Briefly lock input before moving on
    setFeedback('transitioning');

    // Check Auto-Advance Setting (State)
    console.log("Auto Advance State:", autoAdvance); // Debug

    if (autoAdvance) {
      // Auto-advance after 500ms
      setTimeout(() => {
        handleNext();
      }, 5000);
    }
    // Else: Wait for manual "Next" click (which calls handleNext)
    // Else: Wait for manual "Next" click (which calls handleNext)
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < quizStreets.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setFeedback('idle');
      // setQuestionStartTime(Date.now()); // Handled by Effect
      setHintsRevealedCount(0);

      // Generate options for next
      generateOptions(quizStreets[nextIndex], rawStreets);
    } else {
      // Mark today as played when quiz is completed
      try {
        if (!isReplay) {
          markTodayAsPlayed();

          // Save to history
          const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
          const newRecord = {
            date: getTodaySeed(),
            score: score,
            avgTime: (quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) / quizResults.length).toFixed(1),
            timestamp: Date.now()
          };
          history.push(newRecord);
          localStorage.setItem('girify_history', JSON.stringify(history));

          // Save to Global Leaderboard
          if (username) {
            saveScore(username, score, newRecord.avgTime).catch(err => console.error("Leaderboard save failed:", err));
          }
        }
      } catch (e) {
        console.error("Error saving game data:", e);
      }

      setGameState('summary');
    }
  };

  const handleRegister = (name) => {
    setUsername(name);
    localStorage.setItem('girify_username', name);
    setupGame(name); // Start game immediately after registration
  };

  const [activePage, setActivePage] = useState(null); // 'leaderboard', 'settings', 'about' or null

  const handleLogout = () => {
    setUsername('');
    localStorage.removeItem('girify_username');
    localStorage.removeItem('girify_history'); // Optional: clear history too if desired
    setGameState('intro'); // Go back to intro
    setActivePage(null); // Close settings
  };

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
            ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}
        `}>
      {/* Top Navigation */}
      <TopBar onOpenPage={setActivePage} />

      {/* Unified Question Banner - Visible on both Mobile and Desktop */}
      {gameState === 'playing' && (
        <div className="absolute top-12 left-0 right-0 z-[1000] flex flex-col shadow-lg">
          <div className="bg-[#000080] text-white font-bold text-center py-3 px-3 uppercase tracking-wider text-xs sm:text-sm flex justify-between items-center">
            <span>Which street is highlighted?</span>
            <span className="opacity-80 font-mono">Question {currentQuestionIndex + 1} / {quizStreets.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5">
            <div
              className="bg-sky-500 h-1.5 transition-all duration-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
              style={{ width: `${((currentQuestionIndex + 1) / quizStreets.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area - Full Viewport Responsive */}
      <div className={`flex-1 flex ${['mobile', 'tablet'].includes(deviceMode) ? 'flex-col' : 'flex-row'} overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>

        {/* Main Content (Map) - Takes available space */}
        <div className={`relative z-0 min-w-0 ${['mobile', 'tablet'].includes(deviceMode) ? 'flex-1 w-full order-1' : 'flex-1 h-full order-1'}`}>
          <MapArea
            currentStreet={currentStreet}
            hintStreets={gameState === 'playing' ? hintStreets.slice(0, hintsRevealedCount) : []}
            theme={theme}
          />
        </div>

        {/* Sidebar (Quiz Interface) - Fixed width on Desktop, order changes on mobile */}
        {gameState === 'playing' && (
          <div className={`
                  relative z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl shrink-0
                  ${['mobile', 'tablet'].includes(deviceMode)
              ? 'w-full h-[40%] order-2 border-t border-slate-200 dark:border-slate-800'
              : 'w-[350px] lg:w-[400px] h-full order-2 border-l border-slate-200 dark:border-slate-800'
            }
               `}>
            <QuizInterface
              questionIndex={currentQuestionIndex}
              totalQuestions={quizStreets.length}
              score={score}
              options={options}
              onSelectOption={handleSelectAnswer}
              onNext={handleNext}
              feedback={feedback}
              correctName={currentStreet?.name}
              hintStreets={hintStreets}
              onHintReveal={() => setHintsRevealedCount(h => h + 1)}
            />
          </div>
        )}
      </div>

      {/* Overlays (Intro / Summary / Register) - Absolute covering everything */}
      {gameState === 'intro' && (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm pointer-events-auto overflow-hidden">
          <div className="max-w-xs md:max-w-md w-full flex flex-col items-center">
            {/* Logo Image */}
            <img
              src={logoImage}
              alt="Girify Logo"
              className="w-full h-auto mb-6 max-h-40 object-contain animate-fadeIn"
            />
            <p className={`text-lg md:text-xl mb-8 font-light text-center px-4 animate-fadeIn ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Can you name the city's most iconic streets?
            </p>

            <button
              onClick={() => {
                const seen = localStorage.getItem('girify_instructions_seen');
                // If user is registered or has seen instructions, skip them
                if (username || seen === 'true') {
                  // Skip instructions directly to game or register
                  if (username) {
                    setupGame();
                  } else {
                    setGameState('register');
                  }
                } else {
                  setGameState('instructions');
                }
              }}
              className={`w-full max-w-xs px-8 py-4 rounded-full font-bold text-lg tracking-widest hover:scale-105 transition-all duration-300 shadow-xl animate-bounce-subtle
                          ${hasPlayedToday()
                  ? 'bg-[#000080] hover:bg-slate-900 text-white'
                  : 'bg-sky-500 hover:bg-sky-600 text-white'}
                      `}
            >
              {hasPlayedToday() ? (
                <span className="flex flex-col items-center leading-none gap-1">
                  <span>REPLAY CHALLENGE</span>
                  <span className="text-[9px] opacity-80 font-medium normal-case tracking-normal">Score will not be saved</span>
                </span>
              ) : 'START QUIZ'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'instructions' && (
        <div className={`absolute inset-0 z-[2000] flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm transition-colors duration-1000
                ${theme === 'dark' ? 'bg-slate-950/80 text-white' : 'bg-slate-50/80 text-slate-900'}
            `}>
          <h2 className="text-3xl font-bold mb-6 text-sky-500">How to Play</h2>
          <ul className="text-left space-y-4 text-lg mb-8 max-w-md mx-auto">
            <li className="flex gap-3">
              <span>📍</span>
              <span>A street will be highlighted in <span className="text-sky-500 font-bold">Blue</span> on the map.</span>
            </li>
            <li className="flex gap-3">
              <span>🤔</span>
              <span>Guess the correct name from 4 options.</span>
            </li>
            <li className="flex gap-3">
              <span>💡</span>
              <span>Need help? Reveal hints to help you find it.</span>
            </li>
            <li className="flex gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
              <span>⏳</span>
              <span>Speed matters! Higher score for faster answers.</span>
            </li>
          </ul>
          <button
            onClick={() => {
              localStorage.setItem('girify_instructions_seen', 'true');
              if (username) {
                setupGame();
              } else {
                setGameState('register');
              }
            }}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            {username ? "I'M READY!" : "NEXT"}
          </button>
        </div>
      )}

      {gameState === 'register' && (
        <RegisterPanel
          theme={theme}
          onRegister={handleRegister}
        />
      )}

      {gameState === 'summary' && (
        <div className="absolute inset-0 z-50 pointer-events-auto">
          <SummaryScreen
            score={score}
            total={quizStreets.length}
            theme={theme}
            username={username}
            onRestart={setupGame}
            quizResults={quizResults}
            quizStreets={quizStreets}
          />
        </div>
      )}

      {/* Pages Overlays */}
      <AnimatePresence>
        {activePage === 'leaderboard' && <LeaderboardScreen onClose={() => setActivePage(null)} />}
        {activePage === 'settings' && <SettingsScreen onClose={() => setActivePage(null)} onLogout={handleLogout} autoAdvance={autoAdvance} setAutoAdvance={setAutoAdvance} />}
        {activePage === 'about' && <AboutScreen onClose={() => setActivePage(null)} />}
        {activePage === 'profile' && <ProfileScreen onClose={() => setActivePage(null)} username={username} />}
      </AnimatePresence>

    </div>
  );
};

// Extracted Summary Component for cleanliness
const SummaryScreen = ({ score, total, theme, username, onRestart, quizResults, quizStreets }) => {
  const [view, setView] = useState('summary'); // 'summary' or 'rankings'
  const [curiosityRevealed, setCuriosityRevealed] = useState(false);

  const totalTime = quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0);
  const avgTime = quizResults.length ? (totalTime / quizResults.length).toFixed(1) : 0;
  const maxPossibleScore = total * 100;

  // Get contextual curiosity based on the streets played
  const curiosity = useMemo(() => getCuriosityByStreets(quizStreets), [quizStreets]);

  // Dynamic Image State
  const [displayImage, setDisplayImage] = useState(curiosity.image);

  useEffect(() => {
    let active = true;
    const loadDynamicImage = async () => {
      if (curiosity.title) {
        // Try fetching specific location image
        const url = await fetchWikiImage(curiosity.title);
        if (active && url) {
          setDisplayImage(url);
        }
      }
    };
    loadDynamicImage();
    return () => { active = false; };
  }, [curiosity]);

  // Load history for rankings
  const history = JSON.parse(localStorage.getItem('girify_history') || '[]');
  const personalBest = history.length ? Math.max(...history.map(h => h.score)) : score;
  const todayScore = history.find(h => h.date === getTodaySeed())?.score || score;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const text = `🌆 Girify Daily Challenge:\nScore: ${score}/${maxPossibleScore}\nAvg Time: ${avgTime}s\n\nCan you beat me? Play here: ${shareUrl} #Girify #Barcelona`;

    const performShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Girify - Barcelona Street Quiz',
            text: text,
          });
          return true;
        } catch (err) {
          if (err.name !== 'AbortError') console.error(err);
          return false;
        }
      } else {
        await navigator.clipboard.writeText(text);
        alert('Results copied to clipboard!');
        return true;
      }
    };

    const shared = await performShare();
    if (shared) setCuriosityRevealed(true);
  };

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-colors duration-500 pointer-events-auto overflow-y-auto
            ${theme === 'dark' ? 'bg-slate-900/95 text-white' : 'bg-slate-50/95 text-slate-800'}`}>

      {view === 'summary' && !curiosityRevealed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center w-full max-w-md">
          <div className="mb-1">
            <span className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-full text-[10px] uppercase font-bold tracking-widest border border-sky-500/20">
              Daily Challenge Complete
            </span>
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight">{getCongratsMessage(score, maxPossibleScore).replace('!', `, ${getFirstName(username)}!`)}</h2>

          {/* Total Score */}
          <div className={`w-full p-4 rounded-2xl border mb-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold block">Your Score</span>
            <span className="text-3xl font-black text-sky-500">{score}</span>
            <span className="text-xs text-slate-400 ml-1">/ {maxPossibleScore}</span>
          </div>

          {/* 10 Questions Breakdown */}
          <div className="w-full mb-4">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Question Breakdown</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {quizResults.map((result, idx) => {
                const isCorrect = result.status === 'correct';
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all
                      ${isCorrect
                        ? (theme === 'dark' ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-sky-500/10 border-sky-500 text-sky-600')
                        : (theme === 'dark' ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500')
                      }`}
                  >
                    <span className="text-[8px] font-bold opacity-60">Q{idx + 1}</span>
                    <span className="text-sm font-black">{Math.round(result.points)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Share to Unlock Curiosity */}
          <div className={`w-full p-4 rounded-2xl border mb-3 ${theme === 'dark' ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}>
            <p className="text-sky-500 font-bold mb-1 text-sm">🎁 City Curiosity Unlocked!</p>
            <p className="text-[10px] mb-3 text-slate-500 font-medium">Share your results to reveal a secret about Barcelona.</p>
            <button
              onClick={handleShare}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-sm transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share & Reveal
            </button>
          </div>
        </motion.div>
      )}

      {view === 'rankings' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center w-full max-w-sm">
          <h2 className="text-3xl font-black mb-1 tracking-tight">Your Rankings</h2>
          <p className="text-slate-500 mb-8 font-medium text-sm">Personal achievement board</p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
              <span className="text-xs uppercase font-bold opacity-60">Total Score</span>
              <span className="text-3xl font-black text-sky-500">{score}</span>
            </div>
            <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
              <span className="text-xs uppercase font-bold opacity-60">Questions</span>
              <span className="text-3xl font-black">{quizResults.length}/10</span>
            </div>
          </div>
          <div className="w-full space-y-2 mb-8">
            <h3 className="text-left text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-2">Recent Challenges</h3>
            {history.slice(-3).reverse().map((record, i) => (
              <div key={record.timestamp} className={`flex justify-between items-center p-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500">{new Date(record.timestamp).toLocaleDateString()}</p>
                  <p className="text-sm font-black">{record.score} pts</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{record.avgTime}s avg</p>
                </div>
              </div>
            ))}
          </div>


          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => setView('summary')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}
            >
              Back
            </button>
          </div>
        </motion.div>
      )}

      {view === 'breakdown' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center w-full max-w-md h-full pb-20">
          <h2 className="text-2xl font-black mb-6 tracking-tight">Game Breakdown</h2>
          <div className="w-full flex-1 overflow-y-auto space-y-3 pr-2">
            {quizResults.map((res, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border text-left ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Question {idx + 1}</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${res.status === 'correct' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {res.status === 'correct' ? 'CORRECT' : 'WRONG'}
                  </span>
                </div>
                <p className={`font-bold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{res.street.name}</p>

                {res.status !== 'correct' && (
                  <div className="text-xs space-y-1 mt-2 p-2 rounded bg-slate-100 dark:bg-slate-800">
                    <div className="flex gap-2">
                      <span className="opacity-50 w-16">You Picked:</span>
                      <span className="text-rose-500 font-medium line-clamp-1">{res.userAnswer}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="opacity-50 w-16">Correct:</span>
                      <span className="text-emerald-500 font-medium line-clamp-1">{res.street.name}</span>
                    </div>
                  </div>
                )}
                {res.status === 'correct' && (
                  <p className="text-xs text-emerald-500 font-medium mt-1">✓ Correctly identified</p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 w-full flex justify-center">
            <button
              onClick={() => setView('summary')}
              className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'}`}
            >
              Back to Summary
            </button>
          </div>
        </motion.div>
      )}

      {curiosityRevealed && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center max-w-md">
          <h2 className="text-xs font-black mb-1 text-sky-500 uppercase tracking-[0.3em]">City Curiosity</h2>
          <h3 className="text-2xl font-black mb-4 text-slate-800 dark:text-white">{curiosity.title}</h3>

          <div className={`rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <img
              src={displayImage}
              alt="Barcelona"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800"; }}
              className="w-full h-56 object-cover transition-opacity duration-500"
            />
            <div className="p-8">
              <p className={`text-xl leading-relaxed font-bold italic ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>"{curiosity.fact}"</p>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full max-w-sm py-5 bg-sky-500 hover:bg-sky-600 text-white rounded-[2rem] shadow-xl font-black text-xl transition-all transform hover:scale-105"
          >
            PLAY AGAIN
          </button>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-6">See you tomorrow for more!</p>
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
