import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { auth, googleProvider } from '../firebase';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { ensureUserProfile, recordReferral, getUserByEmail } from '../utils/social';
import { storage } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

// Username validation constants
const MAX_USERNAME_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// Basic profanity filter (add more as needed)
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

const validateUsername = (username, t) => {
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

// Helper: Generate a unique handle from a name
const generateHandle = baseName => {
  const cleanName = baseName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const randomId = Math.floor(1000 + Math.random() * 9000);
  return `@${cleanName}${randomId}`;
};

// Helper: Generate random avatar ID
const getRandomAvatarId = () => Math.floor(Math.random() * 20) + 1;

// Helper: Map Firebase error codes to user messages
// Helper: Map Firebase error codes to user messages
const getAuthErrorMessage = (code, message) => {
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
    default:
      return 'Authentication failed. Please try again.';
  }
};

const RegisterPanel = ({ theme: themeProp, onRegister, initialMode = 'signin' }) => {
  const { theme: contextTheme, t } = useTheme();
  const theme = themeProp || contextTheme; // Use prop if provided (GameScreen), else context (standalone)
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  // Sync state with prop if it changes
  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let handle = user.displayName;
      let avatarId = getRandomAvatarId();
      const fullName = user.displayName || user.email?.split('@')[0] || 'User';

      // Check for existing profile by email to prevent duplicates
      const existingProfile = await getUserByEmail(user.email);

      if (existingProfile) {
        handle = existingProfile.username;
        // Enforce @ if missing in existing profile (migration check)
        if (!handle.startsWith('@')) {
          handle = '@' + handle;
        }
        avatarId = existingProfile.avatarId || avatarId;
        // eslint-disable-next-line no-console
        console.log(`[Auth] Found existing profile for email ${user.email}: ${handle}`);
      } else {
        // Create new handle if no profile exists
        handle = generateHandle(fullName);
        // Ensure handle starts with @
        if (!handle.startsWith('@')) {
          handle = '@' + handle;
        }

        if (user.displayName !== handle) {
          await updateProfile(user, { displayName: handle });
        }
      }

      await ensureUserProfile(handle, user.uid, {
        realName: fullName,
        avatarId,
        email: user.email,
      });

      await handlePostLogin(handle, existingProfile);
    } catch (err) {
      setError(getAuthErrorMessage(err.code, err.message));
      setLoading(false);
    }
  };

  const handlePostLogin = async (handle, existingProfile) => {
    // Record referral
    const referrer = storage.get('girify_referrer');
    if (referrer && referrer !== handle && !existingProfile) {
      await recordReferral(referrer, handle);
      storage.remove('girify_referrer');
    }

    // Save joined date
    if (!storage.get('girify_joined')) {
      storage.set('girify_joined', new Date().toLocaleDateString());
    }
    // Callback to parent to close modal / start game
    if (onRegister) onRegister(handle);

    setLoading(false);
  };

  const handleEmailAuth = async e => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('enterEmailAndPassword'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      let userCredential;

      if (isSignUp) {
        if (!firstName || !lastName) {
          setError(t('enterYourName') || 'Please enter your first and last name');
          setLoading(false);
          return;
        }

        const validation = validateUsername(firstName, t);
        if (!validation.valid) {
          setError(validation.error);
          setLoading(false);
          return;
        }

        const handle = generateHandle(firstName);
        const avatarId = getRandomAvatarId();
        const realName = `${firstName} ${lastName}`.trim();

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: handle });
        await sendEmailVerification(userCredential.user);

        await ensureUserProfile(handle, userCredential.user.uid, {
          realName,
          avatarId,
          email: email,
        });

        // Record Referral for Email Signups
        const referrer = storage.get('girify_referrer');
        if (referrer && referrer !== handle) {
          await recordReferral(referrer, handle);
          storage.remove('girify_referrer');
        }

        await auth.signOut();
        // eslint-disable-next-line no-console
        console.log('Verification email sent!');
        setError(t('verificationSent') || 'Verification email sent! Please check your inbox.');
        setIsSignUp(false); // Switch to sign in view
        setLoading(false);
        return;
      }

      // Sign In Flow
      userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setError(
          'Please verify your email address before signing in. Check your inbox for the verification link.'
        );
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Fetch profile to get handle
      const profile = await ensureUserProfile(
        userCredential.user.displayName, // Fallback if needed, but ensureUserProfile handles extraction
        userCredential.user.uid,
        { email: email }
      );

      let handle = profile?.username || userCredential.user.displayName || 'User';
      if (!handle.startsWith('@')) {
        handle = '@' + handle;
      }

      await handlePostLogin(handle, profile);
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
      setLoading(false);
    }
  };

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

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 mb-4 rounded-xl border flex items-center justify-center gap-2 transition-colors bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold text-sm shadow-sm"
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
            ></div>
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
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

RegisterPanel.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light']).isRequired,
  onRegister: PropTypes.func,
};

export default RegisterPanel;
