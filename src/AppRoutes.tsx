import { getRedirectResult, updateProfile } from 'firebase/auth';
import { AnimatePresence } from 'framer-motion';
import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { ensureUserProfile, getUserByEmail, getUserByUid } from './utils/social';

// Eagerly loaded (needed immediately)
import AnnouncementModal from './components/AnnouncementModal';
import DebugOverlay from './components/DebugOverlay';
import TopBar from './components/TopBar';

// Lazy loaded (route-based code splitting)
const GameScreen = lazy(() => import('./features/game/components/GameScreen'));
const AboutScreen = lazy(() => import('./components/AboutScreen'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const FeedbackScreen = lazy(() => import('./components/FeedbackScreen'));
const FriendsScreen = lazy(() => import('./features/friends/components/FriendsScreen'));
const LeaderboardScreen = lazy(() => import('./features/leaderboard/components/LeaderboardScreen'));
const NewsScreen = lazy(() => import('./components/NewsScreen'));
const ProfileScreen = lazy(() => import('./features/profile/components/ProfileScreen'));
const PublicProfileScreen = lazy(() => import('./features/profile/components/PublicProfileScreen'));
const SettingsScreen = lazy(() => import('./components/SettingsScreen'));
const ShopScreen = lazy(() => import('./features/shop/components/ShopScreen'));
const StreetsFetcher = lazy(() => import('./features/game/components/StreetsFetcher'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const VerifyEmailScreen = lazy(() => import('./features/auth/components/VerifyEmailScreen'));
const AchievementModal = lazy(() => import('./components/AchievementModal'));
const ConfirmDialog = lazy(() =>
  import('./components/ConfirmDialog').then(m => ({ default: m.ConfirmDialog }))
);
const DistrictSelectionModal = lazy(() => import('./components/DistrictSelectionModal'));

import { STORAGE_KEYS } from './config/constants';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './features/auth/hooks/useAuth';
import { useGameState } from './features/game/hooks/useGameState';
import { useStreets } from './features/game/hooks/useStreets';
import { useAchievements } from './hooks/useAchievements';
import { useAnnouncements } from './hooks/useAnnouncements';
import { GameHistory } from './types/user';
import { getTodaySeed, hasPlayedToday } from './utils/dailyChallenge';
import { debugLog } from './utils/debug';
import { storage } from './utils/storage';

import { useConfirm } from './hooks/useConfirm';
import { normalizeUsername } from './utils/format';
import { getUserProfile } from './utils/social';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
  </div>
);

const AppRoutes: React.FC = () => {
  const { theme, t, deviceMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  // Street data hook
  const { validStreets, getHintStreets, isLoading: isLoadingStreets } = useStreets();

  // Confirmation Hook
  const { confirm, confirmConfig, handleClose } = useConfirm();

  // Game Logic Hook - Always call this, even if streets are empty initially
  const {
    state,
    dispatch,
    currentStreet,
    setupGame,
    handleSelectAnswer,
    handleNext,
    handleRegister,
    processAnswer,
  } = useGameState(validStreets, getHintStreets);

  // Announcement hook
  const { pendingAnnouncement, dismissAnnouncement, checkAnnouncements } = useAnnouncements(
    state.username || ''
  );

  // Achievement hook
  const { newlyUnlockedBadge, dismissAchievement } = useAchievements(
    state.username,
    state.gameState,
    location.pathname
  );

  // Auth hook
  const { emailVerified, handleLogout: performLogout } = useAuth(
    dispatch,
    state.gameState,
    checkAnnouncements
  );
  const handleLogout = () => performLogout(navigate);

  const [showDistrictModal, setShowDistrictModal] = React.useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = React.useState(false);
  const [hasProcessedRedirect, setHasProcessedRedirect] = React.useState(false);

  // Track district selection state with a ref (not affected by closures)
  // This is set to true BEFORE showing modal and stays true for the session
  const districtFlowActive = React.useRef(false);

  // Handle Google redirect result for Mobile Safari
  useEffect(() => {
    // Skip if we've already processed a redirect result this session
    if (hasProcessedRedirect) {
      return;
    }

    const handleRedirectResult = async () => {
      debugLog('Running handleRedirectResult...');
      console.warn('[Auth Redirect] Starting redirect result check...');
      try {
        setIsProcessingRedirect(true);
        const result = await getRedirectResult(auth);
        debugLog(`getRedirectResult: ${result ? 'User found' : 'NULL'}`);

        // Only block useAuth if we actually have a redirect result to process
        // This prevents blocking useAuth when there's no redirect (normal app load)
        if (result?.user) {
          sessionStorage.setItem('girify_processing_redirect', 'true');
        }

        console.warn(
          '[Auth Redirect] getRedirectResult returned:',
          result ? 'User found' : 'No user'
        );

        if (result?.user) {
          setHasProcessedRedirect(true);
          // Clear the redirect pending flag on successful redirect
          sessionStorage.removeItem('girify_redirect_pending');
          debugLog(`Processing User UID: ${result.user.uid}`);
          console.warn('[Auth Redirect] Processing user:', result.user.uid, result.user.email);

          const user = result.user;
          let handle = user.displayName || '';
          // eslint-disable-next-line no-magic-numbers
          let avatarId = Math.floor(Math.random() * 20) + 1;
          const fullName = user.displayName || user.email?.split('@')[0] || 'User';

          // Check for existing profile by UID first, then email
          console.warn('[Auth Redirect] Checking for existing profile...');
          let existingProfile = (await getUserByUid(user.uid)) as any;
          console.warn('[Auth Redirect] Profile by UID:', existingProfile ? 'Found' : 'Not found');

          if (!existingProfile) {
            existingProfile = (await getUserByEmail(user.email || '')) as any;
            console.warn(
              '[Auth Redirect] Profile by email:',
              existingProfile ? 'Found' : 'Not found'
            );
          }

          if (existingProfile) {
            // Existing user - use their handle and district
            handle = existingProfile.username || handle || fullName;
            if (!handle.startsWith('@')) {
              handle = `@${handle}`;
            }
            avatarId = existingProfile.avatarId || avatarId;
            console.warn(
              '[Auth Redirect] Existing user handle:',
              handle,
              'district:',
              existingProfile.district
            );

            // Ensure profile is up to date
            if (existingProfile.district) {
              await ensureUserProfile(handle, user.uid, {
                realName: fullName,
                avatarId,
                email: user.email || undefined,
                district: existingProfile.district,
              });

              // Clear referrer for existing users (they can't be referred again)
              storage.remove(STORAGE_KEYS.REFERRER);

              // Complete registration
              console.warn('[Auth Redirect] Calling handleRegister with:', handle);
              handleRegister(handle);
            } else {
              // Existing user but no district - show district modal
              console.warn('[Auth Redirect] User exists but no district, showing modal');
              if (user.displayName !== handle) {
                await updateProfile(user, { displayName: handle });
              }
              // Set username so district modal can use it
              storage.set(STORAGE_KEYS.USERNAME, handle);
              // dispatch({ type: 'SET_USERNAME', payload: handle }); // Handled by useAuth

              // Mark district flow as active BEFORE showing modal to prevent race conditions
              districtFlowActive.current = true;
              setShowDistrictModal(true);
            }
          } else {
            // New user - generate handle and show district modal
            const namePart = (fullName.split(' ')[0] || 'User').replace(/[^a-zA-Z0-9]/g, '');
            // eslint-disable-next-line no-magic-numbers
            handle = `@${namePart}${Math.floor(1000 + Math.random() * 9000)}`;
            console.warn('[Auth Redirect] New user, generated handle:', handle);

            if (user.displayName !== handle) {
              await updateProfile(user, { displayName: handle });
            }

            // Set username so district modal can use it
            storage.set(STORAGE_KEYS.USERNAME, handle);
            // dispatch({ type: 'SET_USERNAME', payload: handle }); // Handled by useAuth

            // Will need district selection before completing registration
            console.warn('[Auth Redirect] Showing district modal for new user');
            // Mark district flow as active BEFORE showing modal to prevent race conditions
            districtFlowActive.current = true;
            setShowDistrictModal(true);
          }

          console.warn('[Auth Redirect] Completed successfully');
        } else {
          console.warn('[Auth Redirect] No redirect result to process');

          // Check if we were expecting a redirect
          const pendingRedirect = sessionStorage.getItem('girify_redirect_pending');
          if (pendingRedirect) {
            console.error(
              '[Auth Redirect] Redirect flow incomplete. Possible mobile browser storage issue.'
            );
            sessionStorage.removeItem('girify_redirect_pending');
          }
          // No redirect result - useAuth will handle the auth state normally
        }
      } catch (err) {
        console.error('[Auth Redirect] Error:', err);
      } finally {
        setIsProcessingRedirect(false);
        // Clear the redirect processing flag (if not already cleared)
        sessionStorage.removeItem('girify_processing_redirect');
      }
    };

    handleRedirectResult();
  }, [hasProcessedRedirect]); // Run only once on mount (guard prevents re-runs)

  // Track if we've already checked district this app lifecycle
  const hasCheckedDistrict = React.useRef(false);

  // Check for missing district - only once per app lifecycle
  React.useEffect(() => {
    const checkDistrict = async () => {
      // Skip if district flow is already active (set before modal shows)
      if (districtFlowActive.current) {
        console.warn('[District Check] Skipping - district flow already active');
        return;
      }
      // Skip if we've already checked this app lifecycle
      if (hasCheckedDistrict.current) {
        console.warn('[District Check] Skipping - already checked this app lifecycle');
        return;
      }
      if (state.username && !normalizeUsername(state.username).startsWith('guest')) {
        // Mark as checked immediately to prevent duplicate checks
        hasCheckedDistrict.current = true;
        console.warn('[District Check] Checking district for:', state.username);
        try {
          const profile = await getUserProfile(state.username);
          console.warn('[District Check] Profile district:', profile?.district);
          if (profile && !profile.district) {
            // Double-check ref again after async operation
            if (districtFlowActive.current) {
              console.warn('[District Check] Skipping modal - flow became active during fetch');
              return;
            }
            districtFlowActive.current = true;
            setShowDistrictModal(true);
          }
        } catch (e) {
          console.error('Error checking district:', e);
          // Reset the check flag on error so it can retry
          hasCheckedDistrict.current = false;
        }
      }
    };

    // Simple debounce/delay to avoid checking too early
    const timeout = setTimeout(checkDistrict, 2000);
    return () => clearTimeout(timeout);
  }, [state.username]);

  // Show loader while streets are initializing or processing redirect
  // This MUST be after all hooks are declared
  if (isLoadingStreets || isProcessingRedirect) {
    return <PageLoader />;
  }

  const handleOpenPage = async (page: string | null) => {
    // Check if user is in the middle of a game
    if (state.gameState === 'playing' && state.currentQuestionIndex < state.quizStreets.length) {
      const confirmed = await confirm(
        t('exitGameWarning') ||
          'Exit game? Your current score will be saved. You can play again anytime!',
        'Exit Game',
        true
      );
      if (!confirmed) {
        return;
      } // Don't navigate if user cancels

      // User confirmed - save current progress before exiting
      try {
        const history = storage.get<GameHistory[]>(STORAGE_KEYS.HISTORY, []);
        const avgTime = state.quizResults.length
          ? (
              state.quizResults.reduce((acc, curr) => acc + (curr.time || 0), 0) /
              state.quizResults.length
            ).toFixed(1)
          : 0;

        const partialRecord = {
          date: getTodaySeed().toString(),
          score: state.score,
          avgTime: avgTime.toString(),
          timestamp: Date.now(),
          username: state.username || 'guest',
          incomplete: true, // Mark as incomplete
        };
        history.push(partialRecord);
        storage.set(STORAGE_KEYS.HISTORY, history);

        // Deprecated: saveScore() is legacy code
        // Scores are now saved via useGamePersistence hook using Redis → Supabase flow
        // Partial games (interrupted) are stored locally but not submitted to leaderboard
      } catch (e) {
        console.error('[Game] Error saving partial progress:', e);
      }

      // Reset game state to intro so game can be restarted
      dispatch({ type: 'SET_GAME_STATE', payload: 'summary' });
    }

    // If null/undefined, go home. Else go to page.
    navigate(page ? `/${page}` : '/');
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
            bg-slate-50 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
        `}
    >
      <TopBar
        onOpenPage={handleOpenPage}
        username={state.username || undefined}
        onTriggerLogin={(mode = 'signin') => {
          dispatch({ type: 'SET_REGISTER_MODE', payload: mode });
          dispatch({ type: 'SET_GAME_STATE', payload: 'register' });
          navigate('/');
        }}
        onLogout={handleLogout}
      />

      {/* Announcement Modal */}
      <AnimatePresence>
        {pendingAnnouncement && (
          <AnnouncementModal announcement={pendingAnnouncement} onDismiss={dismissAnnouncement} />
        )}
      </AnimatePresence>

      {/* Achievement Modal */}
      <AnimatePresence>
        {newlyUnlockedBadge && (
          <Suspense fallback={null}>
            <AchievementModal achievement={newlyUnlockedBadge} onDismiss={dismissAchievement} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* District Selection Modal */}
      <AnimatePresence>
        {showDistrictModal && (
          <Suspense fallback={null}>
            <DistrictSelectionModal
              username={state.username || ''}
              onComplete={() => {
                console.warn('[District Modal] Completing district selection');
                // districtFlowActive.current stays true (was set before modal opened)
                setShowDistrictModal(false);
                // If user has a username set, complete the registration
                if (state.username) {
                  handleRegister(state.username);
                }
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route
              path="/"
              element={
                state.username && !emailVerified ? (
                  <VerifyEmailScreen theme={theme as 'light' | 'dark'} />
                ) : (
                  <GameScreen
                    state={state}
                    dispatch={dispatch}
                    theme={theme as 'light' | 'dark'}
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
                )
              }
            />
            <Route
              path="/leaderboard"
              element={<LeaderboardScreen currentUser={state.username || undefined} />}
            />
            <Route
              path="/settings"
              element={
                <SettingsScreen
                  onClose={() => handleOpenPage(null)}
                  onLogout={handleLogout}
                  autoAdvance={state.autoAdvance}
                  setAutoAdvance={val => dispatch({ type: 'SET_AUTO_ADVANCE', payload: val })}
                  username={state.username || undefined}
                />
              }
            />
            <Route path="/about" element={<AboutScreen onClose={() => handleOpenPage(null)} />} />
            <Route path="/profile" element={<ProfileScreen username={state.username || ''} />} />
            <Route
              path="/user/:username"
              element={<PublicProfileScreen currentUser={state.username || undefined} />}
            />
            <Route
              path="/friends"
              element={
                <FriendsScreen
                  username={state.username || ''}
                  onClose={() => handleOpenPage(null)}
                />
              }
            />
            <Route path="/shop" element={<ShopScreen username={state.username || ''} />} />
            <Route
              path="/news"
              element={
                <NewsScreen
                  username={state.username || undefined}
                  onClose={() => handleOpenPage(null)}
                />
              }
            />
            <Route
              path="/feedback"
              element={
                <FeedbackScreen
                  username={state.username || ''}
                  onClose={() => {
                    storage.set(STORAGE_KEYS.LAST_FEEDBACK, Date.now().toString());
                    handleOpenPage(null);
                  }}
                />
              }
            />

            {/* Admin Route */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/fetch-streets" element={<StreetsFetcher />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* Global Copyright Footer */}
      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none opacity-40 mix-blend-difference pb-4">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-inter">
          © 2025 Girify. All rights reserved.
        </p>
      </div>

      <Suspense fallback={null}>
        <ConfirmDialog
          isOpen={!!confirmConfig}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          isDangerous={confirmConfig?.isDangerous || false}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      </Suspense>

      {/* DEBUG OVERLAY - RESTORED FOR LEADERBOARD DEBUG */}
      <DebugOverlay />
    </div>
  );
};

export default AppRoutes;
