import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../../config/constants';
import { useTheme } from '../../../context/ThemeContext';
import { DISTRICTS } from '../../../data/districts';
import { auth, googleProvider } from '../../../firebase';
import { ensureUserProfile, getUserByEmail, recordReferral } from '../../../utils/social';
import { storage } from '../../../utils/storage';

const MAX_USERNAME_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const BLOCKED_WORDS = [
  'admin',
  'moderator',
  'girify',
  'support',
  'official',
  'fuck',
  'shit',
  'ass',
  'bitch',
  'dick',
  'cock',
  'pussy',
  'nazi',
  'hitler',
  'nigger',
  'faggot',
  'retard',
];

const validateUsername = (username: string, t: (key: string) => string) => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: t('usernameRequired') };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: t('usernameTooLong') };
  }
  if (username.length < 3) {
    return { valid: false, error: t('usernameShort') };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: t('usernameInvalid') };
  }

  const lowerName = username.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerName.includes(word)) {
      return { valid: false, error: t('usernameNotAllowed') };
    }
  }

  return { valid: true, error: null };
};

const generateHandle = (baseName: string) => {
  const cleanName = (baseName.split(' ')[0] || 'User').replace(/[^a-zA-Z0-9]/g, '');
  const randomId = Math.floor(1000 + Math.random() * 9000);
  return `@${cleanName}${randomId}`;
};

const getRandomAvatarId = () => Math.floor(Math.random() * 20) + 1;

const getAuthErrorMessage = (code: string, message?: string) => {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Multiple sign-in attempts detected. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-blocked':
      return message
        ? `Google sign-in failed: ${message}`
        : 'Popup blocked by browser. Please allow popups and try again.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';
    case 'auth/internal-error':
      return message
        ? `Authentication error: ${message}`
        : 'An internal error occurred. Please try again.';
    default:
      return message
        ? `Authentication failed: ${message}`
        : 'Authentication failed. Please try again.';
  }
};

interface RegisterPanelProps {
  theme?: 'dark' | 'light';
  onRegister?: (handle: string) => void;
  initialMode?: 'signin' | 'signup';
}

const RegisterPanel: React.FC<RegisterPanelProps> = ({
  theme: themeProp,
  onRegister,
  initialMode = 'signin',
}) => {
  const { theme: contextTheme, t } = useTheme();
  const theme = themeProp || contextTheme;
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if mobile Safari (popups often blocked)
  // const isOnMobileSafari = isMobileSafari();

  // Handle redirect result on mount (for mobile Safari flow)
  // NOTE: This is now handled in AppRoutes.tsx to avoid race conditions.
  // getRedirectResult can only return the result ONCE, so having two handlers
  // causes whichever runs first to consume the result, leaving the other with null.

  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    user: import('firebase/auth').User;
    handle: string;
    fullName: string;
    avatarId: number;
    email: string | null;
  } | null>(null);

  // Shared logic for processing Google user after popup or redirect
  const processGoogleUser = async (user: import('firebase/auth').User) => {
    try {
      console.warn('[AuthDebug] Processing Google User:', user.uid, user.email);
      let handle = user.displayName || '';
      let avatarId = getRandomAvatarId();
      const fullName = user.displayName || user.email?.split('@')[0] || 'User';

      // Critical: Check by UID first (most reliable), then by email
      const { getUserByUid } = await import('../../../utils/social');
      let existingProfile = (await getUserByUid(user.uid)) as any;
      console.warn('[AuthDebug] Profile check by UID:', existingProfile ? 'Found' : 'Not Found');

      if (!existingProfile) {
        console.warn('[AuthDebug] Checking by email fallback...');
        existingProfile = (await getUserByEmail(user.email || '')) as any;
        console.warn(
          '[AuthDebug] Profile check by Email:',
          existingProfile ? 'Found' : 'Not Found'
        );
      }

      if (existingProfile) {
        handle = existingProfile.username;
        if (!handle.startsWith('@')) {
          handle = `@${handle}`;
        }
        avatarId = existingProfile.avatarId || avatarId;
      } else {
        handle = generateHandle(fullName);
        if (!handle.startsWith('@')) {
          handle = `@${handle}`;
        }
        console.warn('[AuthDebug] New user, generated handle:', handle);

        if (user.displayName !== handle) {
          await updateProfile(user, { displayName: handle });
        }
      }

      // Force district selection for new users or those without a district
      if (!existingProfile?.district) {
        console.warn('[AuthDebug] No district in profile. Stopping to show District Modal.');
        setPendingGoogleUser({
          user,
          handle,
          fullName,
          avatarId,
          email: user.email || null,
        });
        setLoading(false);
        return;
      }

      console.warn('[AuthDebug] District found in profile:', existingProfile.district);
      console.warn('[AuthDebug] Calling ensureUserProfile...');
      await ensureUserProfile(handle, user.uid, {
        realName: fullName,
        avatarId,
        email: user.email || undefined,
        district: existingProfile.district,
      });

      console.warn('[AuthDebug] Calls handlePostLogin...');
      await handlePostLogin(handle, true);
    } catch (err) {
      console.error('[AuthDebug] Error in processGoogleUser:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(`Login processing failed: ${error.message}`);
      setLoading(false);
    }
  };

  const completeGoogleSignup = async () => {
    if (!pendingGoogleUser || !district) {
      return;
    }

    setLoading(true);
    try {
      await ensureUserProfile(pendingGoogleUser.handle, pendingGoogleUser.user.uid, {
        realName: pendingGoogleUser.fullName,
        avatarId: pendingGoogleUser.avatarId,
        email: pendingGoogleUser.email || undefined,
        district: district,
      });

      await handlePostLogin(pendingGoogleUser.handle, false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(getAuthErrorMessage('auth/error', error.message));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.warn('[AuthDebug] Starting Google Login...');
      setLoading(true);
      setError('');

      // Force account selection to allow switching accounts - REMOVED for mobile redirect fix
      // googleProvider.setCustomParameters({ prompt: 'select_account' });

      // Use redirect on mobile devices (popups are often blocked or fail in in-app browsers)
      // This covers iOS (Safari/Chrome) and Android (Chrome/etc)
      // const isMobileDevice = isMobile();

      // DEBUG: Temporarily disable redirect to see if Popup works better on this device
      // if (isOnMobileSafari || isMobileDevice) {
      //   console.warn('[AuthDebug] Mobile device detected, using redirect');
      //   try {
      //     // Set tracking flag to debug loops
      //     sessionStorage.setItem('girify_redirect_pending', 'true');
      //   } catch (e) {
      //     console.warn('Storage failed', e);
      //   }
      //   await signInWithRedirect(auth, googleProvider);
      //   return; // Will be handled by getRedirectResult on page reload
      // }

      // Use popup for desktop and other browsers
      console.warn('[AuthDebug] Using popup for sign in (Forced for Debug)');
      const result = await signInWithPopup(auth, googleProvider);
      console.warn('[AuthDebug] Popup success, user:', result.user.uid);
      await processGoogleUser(result.user);
    } catch (err: unknown) {
      console.error('[AuthDebug] Google Login Error:', err);
      const firebaseError = err as { code?: string; message?: string };
      const errorCode = firebaseError.code || 'auth/error';
      const errorMessage = firebaseError.message;
      console.error('[AuthDebug] Error code:', errorCode, 'Message:', errorMessage);
      setError(getAuthErrorMessage(errorCode, errorMessage));
      setLoading(false);
    }
  };

  const handlePostLogin = async (handle: string, isExisting: boolean) => {
    console.warn('[AuthDebug] handlePostLogin called for:', handle, 'Existing:', isExisting);
    const referrer = storage.get('girify_referrer', '');
    if (referrer && referrer !== handle && !isExisting) {
      await recordReferral(referrer, handle);
      storage.remove('girify_referrer');
    }

    if (!storage.get('girify_joined', null)) {
      storage.set('girify_joined', new Date().toLocaleDateString());
    }
    if (onRegister) {
      console.warn('[AuthDebug] Calling onRegister callback...');
      onRegister(handle);
    } else {
      console.warn('[AuthDebug] NO onRegister callback defined!');
    }

    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('enterEmailAndPassword'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isSignUp) {
        if (!firstName || !lastName || !district) {
          setError(t('fillAllFields') || 'Please enter all fields including district');
          setLoading(false);
          return;
        }

        const validation = validateUsername(firstName, t);
        if (!validation.valid) {
          setError(validation.error || 'Invalid username');
          setLoading(false);
          return;
        }

        const handle = generateHandle(firstName);
        const avatarId = getRandomAvatarId();
        const realName = `${firstName} ${lastName}`.trim();

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: handle });
        await sendEmailVerification(userCredential.user);

        await ensureUserProfile(handle, userCredential.user.uid, {
          realName,
          avatarId,
          email,
          district,
        });

        const referrer = storage.get('girify_referrer', '');
        if (referrer && referrer !== handle) {
          await recordReferral(referrer, handle);
          storage.remove('girify_referrer');
        }

        await auth.signOut();
        setError(t('verificationSent') || 'Verification email sent! Please check your inbox.');
        setIsSignUp(false);
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setError(
          'Please verify your email address before signing in. Check your inbox for the verification link.'
        );
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Email signin - DO NOT call ensureUserProfile here to avoid overwriting district
      // useAuth's syncUserProfile will handle it globally
      // Just make sure we have the username in storage so useAuth uses it
      const displayName = userCredential.user.displayName || '';
      const storedUsername = storage.get(STORAGE_KEYS.USERNAME, '');

      if (!storedUsername && displayName) {
        storage.set(STORAGE_KEYS.USERNAME, displayName);
      }

      let handle = storedUsername || displayName || 'User';

      // We don't have the full profile here, but that's fine, useAuth will fetch it
      // We just need the handle for the welcome message/post-login flow

      if (!handle.startsWith('@')) {
        handle = `@${handle}`;
      }

      await handlePostLogin(handle, true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(getAuthErrorMessage((error as any).code || 'auth/error'));
      setLoading(false);
    }
  };

  if (pendingGoogleUser) {
    return (
      <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl border my-auto ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-700 text-white'
              : 'bg-white/90 border-slate-200 text-slate-900'
          }`}
        >
          <h2 className="text-2xl font-black mb-2 tracking-tight text-center">One Last Step!</h2>
          <p
            className={`text-sm text-center mb-6 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
          >
            Welcome, <span className="font-bold text-sky-500">{pendingGoogleUser.handle}</span>!{' '}
            <br />
            Please choose your district to complete your registration.
          </p>

          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {DISTRICTS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDistrict(d.id)}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group
                    ${
                      district === d.id
                        ? `border-${d.color.split('-')[1]}-500 bg-${d.color.split('-')[1]}-500/10 active-district-ring`
                        : `border-transparent ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-50'} hover:border-slate-300 dark:hover:border-slate-600`
                    }
                  `}
                >
                  <img
                    src={d.logo}
                    alt={d.teamName}
                    className="w-8 h-8 object-contain"
                    style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] font-black uppercase truncate ${district === d.id ? 'text-sky-500' : 'text-slate-500'}`}
                    >
                      {d.name}
                    </p>
                  </div>

                  {district === d.id && (
                    <div className="absolute inset-0 rounded-xl border-2 border-sky-500 pointer-events-none shadow-[0_0_10px_rgba(14,165,233,0.3)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={completeGoogleSignup}
            disabled={!district || loading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 text-white
                ${!district || loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'}
            `}
          >
            {loading ? 'Finalizing...' : 'Complete Registration'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl pointer-events-auto overflow-hidden overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl border my-auto ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-700 text-white'
            : 'bg-white/90 border-slate-200 text-slate-900'
        }`}
      >
        <h2 className="text-3xl font-black mb-2 tracking-tight text-center">
          {isSignUp ? 'Join Girify' : 'Welcome Back'}
        </h2>
        <p
          className={`text-xs text-center mb-6 uppercase tracking-wider font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {isSignUp ? 'Create an account to track stats' : 'Sign in to continue'}
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 mb-4 rounded-xl border flex items-center justify-center gap-2 transition-colors bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold text-sm shadow-sm"
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div
              className={`w-full border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}
            />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span
              className={`px-2 ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}
            >
              Or with email
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {isSignUp && (
            <>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={t('firstName') || 'First Name'}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={`w-1/2 px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <input
                  type="text"
                  placeholder={t('lastName') || 'Last Name'}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={`w-1/2 px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <div className="space-y-3">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  {t('chooseYourDistrict') || 'Choose Your Allegiance'}
                </label>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {DISTRICTS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDistrict(d.id)}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group
                        ${
                          district === d.id
                            ? `border-${d.color.split('-')[1]}-500 bg-${d.color.split('-')[1]}-500/10 active-district-ring`
                            : `border-transparent ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-50'} hover:border-slate-300 dark:hover:border-slate-600`
                        }
                      `}
                    >
                      <img
                        src={d.logo}
                        alt={d.teamName}
                        className="w-8 h-8 object-contain"
                        style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[10px] font-black uppercase truncate ${district === d.id ? 'text-sky-500' : 'text-slate-500'}`}
                        >
                          {d.name}
                        </p>
                        <p
                          className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                        >
                          {d.teamName.replace(d.name, '').trim() || d.teamName}
                        </p>
                      </div>

                      {district === d.id && (
                        <div className="absolute inset-0 rounded-xl border-2 border-sky-500 pointer-events-none shadow-[0_0_10px_rgba(14,165,233,0.3)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {district && (
                <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-fadeIn">
                  {(() => {
                    const d = DISTRICTS.find(dist => dist.id === district);
                    if (!d) {
                      return null;
                    }
                    return (
                      <>
                        <div
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${d.color} p-0.5 shadow-lg`}
                        >
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white/20">
                            <img
                              src={d.logo}
                              alt={d.teamName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold opacity-50 uppercase tracking-widest">
                            {t('youAreJoining') || 'You are joining'}
                          </p>
                          <h3
                            className={`text-xl font-black bg-gradient-to-r ${d.color} bg-clip-text text-transparent`}
                          >
                            {d.teamName}
                          </h3>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 text-white
                            ${loading ? 'bg-slate-400 cursor-wait' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'}
                        `}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={`text-xs font-semibold hover:underline ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            type="button"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPanel;
