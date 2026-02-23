import { useEffect, useRef, useState } from 'react';
import {
  DISTRICT_CHECK_DELAY_MS,
  getRandomAvatarId,
  getRandomHandleSuffix,
} from '../config/appConstants';
import { STORAGE_KEYS } from '../config/constants';
import { supabase } from '../services/supabase';
import { debugLog } from '../utils/debug';
import { normalizeUsername } from '../utils/format';
import { ensureUserProfile, getUserByEmail, getUserByUid, getUserProfile } from '../utils/social';
import { storage } from '../utils/storage';

interface UseAuthRedirectOptions {
  username: string | null;
  handleRegister: (handle: string) => void;
}

export interface UseAuthRedirectReturn {
  showDistrictModal: boolean;
  setShowDistrictModal: (show: boolean) => void;
  isProcessingRedirect: boolean;
  districtFlowActive: React.MutableRefObject<boolean>;
  handleDistrictComplete: () => void;
  handleDistrictDismiss: () => void;
}

export function useAuthRedirect({
  username,
  handleRegister,
}: UseAuthRedirectOptions): UseAuthRedirectReturn {
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [hasProcessedRedirect, setHasProcessedRedirect] = useState(false);
  const [authTick, setAuthTick] = useState(0);
  const districtFlowActive = useRef(false);
  const checkedDistrictForUsername = useRef<string | null>(null);

  // Handle OAuth redirect result
  useEffect(() => {
    if (hasProcessedRedirect) {
      return;
    }

    const handleRedirectResult = async () => {
      debugLog('Running handleRedirectResult...');

      // Check if we're returning from an OAuth redirect
      // Supabase stores the auth result in the URL hash after redirect
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (!accessToken) {
        return;
      }

      try {
        setIsProcessingRedirect(true);
        sessionStorage.setItem('girify_processing_redirect', 'true');

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setHasProcessedRedirect(true);
          sessionStorage.removeItem('girify_redirect_pending');

          let handle = user.user_metadata?.full_name || user.user_metadata?.name || '';
          let avatarId = getRandomAvatarId();
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User';

          let existingProfile = (await getUserByUid(user.id)) as any;

          if (!existingProfile) {
            existingProfile = (await getUserByEmail(user.email || '')) as any;
          }

          if (existingProfile) {
            handle = existingProfile.username || handle || fullName;
            if (!handle.startsWith('@')) {
              handle = `@${handle}`;
            }
            avatarId = existingProfile.avatarId || avatarId;

            if (existingProfile.district) {
              await ensureUserProfile(handle, user.id, {
                realName: fullName,
                avatarId,
                email: user.email || undefined,
                district: existingProfile.district,
              });
              storage.remove(STORAGE_KEYS.REFERRER);
              handleRegister(handle);
            } else {
              await supabase.auth.updateUser({ data: { display_name: handle } });
              storage.set(STORAGE_KEYS.USERNAME, handle);
              districtFlowActive.current = true;
              setShowDistrictModal(true);
            }
          } else {
            const namePart = (fullName.split(' ')[0] || 'User').replace(/[^a-zA-Z0-9]/g, '');
            handle = `@${namePart}${getRandomHandleSuffix()}`;

            await supabase.auth.updateUser({ data: { display_name: handle } });
            storage.set(STORAGE_KEYS.USERNAME, handle);
            districtFlowActive.current = true;
            setShowDistrictModal(true);
          }
        }
      } catch (err) {
        console.error('[Auth Redirect] Error:', err);
      } finally {
        setIsProcessingRedirect(false);
        sessionStorage.removeItem('girify_processing_redirect');
      }
    };

    handleRedirectResult();
  }, [hasProcessedRedirect, handleRegister]);

  // Reset the district check whenever the user signs in, so it re-runs even
  // if the username string hasn't changed (e.g. old Firebase users whose
  // localStorage username matches their DB username without the @ prefix).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN') {
        checkedDistrictForUsername.current = null;
        setAuthTick(t => t + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check for missing district — only for authenticated users.
  // Legacy users (old Firebase session in localStorage) have no Supabase session
  // and cannot complete the update, so skip the modal until they sign in.
  useEffect(() => {
    const checkDistrict = async () => {
      if (districtFlowActive.current) {
        return;
      }

      if (!username || normalizeUsername(username).startsWith('guest')) {
        return;
      }

      if (checkedDistrictForUsername.current === username) {
        return;
      }

      // Require an active Supabase session — the district update will fail otherwise.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        // Don't mark as checked so the check can re-run after the user signs in.
        return;
      }

      checkedDistrictForUsername.current = username;

      try {
        const profile = await getUserProfile(username);
        if (profile && !profile.district) {
          if (districtFlowActive.current) {
            return;
          }
          districtFlowActive.current = true;
          setShowDistrictModal(true);
        }
      } catch (e) {
        console.error('Error checking district:', e);
        checkedDistrictForUsername.current = null;
      }
    };

    const timeout = setTimeout(checkDistrict, DISTRICT_CHECK_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [username, authTick]);

  const handleDistrictComplete = () => {
    setShowDistrictModal(false);
    if (username) {
      handleRegister(username);
    }
  };

  const handleDistrictDismiss = () => {
    districtFlowActive.current = false;
    checkedDistrictForUsername.current = null;
    setShowDistrictModal(false);
  };

  return {
    showDistrictModal,
    setShowDistrictModal,
    isProcessingRedirect,
    districtFlowActive,
    handleDistrictComplete,
    handleDistrictDismiss,
  };
}
