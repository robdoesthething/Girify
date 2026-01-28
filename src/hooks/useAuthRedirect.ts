/**
 * useAuthRedirect Hook
 *
 * Handles Google auth redirect flow and district selection modal state.
 */

import { getRedirectResult, updateProfile } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import {
  DISTRICT_CHECK_DELAY_MS,
  getRandomAvatarId,
  getRandomHandleSuffix,
} from '../config/appConstants';
import { STORAGE_KEYS } from '../config/constants';
import { auth } from '../firebase';
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
}

export function useAuthRedirect({
  username,
  handleRegister,
}: UseAuthRedirectOptions): UseAuthRedirectReturn {
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [hasProcessedRedirect, setHasProcessedRedirect] = useState(false);
  const districtFlowActive = useRef(false);
  const checkedDistrictForUsername = useRef<string | null>(null);

  // Handle Google redirect result for Mobile Safari
  useEffect(() => {
    if (hasProcessedRedirect) {
      return;
    }

    const handleRedirectResult = async () => {
      debugLog('Running handleRedirectResult...');
      try {
        setIsProcessingRedirect(true);
        const result = await getRedirectResult(auth);

        if (result?.user) {
          sessionStorage.setItem('girify_processing_redirect', 'true');
        }

        if (result?.user) {
          setHasProcessedRedirect(true);
          sessionStorage.removeItem('girify_redirect_pending');

          const user = result.user;
          let handle = user.displayName || '';
          let avatarId = getRandomAvatarId();
          const fullName = user.displayName || user.email?.split('@')[0] || 'User';

          let existingProfile = (await getUserByUid(user.uid)) as any;

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
              await ensureUserProfile(handle, user.uid, {
                realName: fullName,
                avatarId,
                email: user.email || undefined,
                district: existingProfile.district,
              });
              storage.remove(STORAGE_KEYS.REFERRER);
              handleRegister(handle);
            } else {
              // eslint-disable-next-line max-depth
              if (user.displayName !== handle) {
                await updateProfile(user, { displayName: handle });
              }
              storage.set(STORAGE_KEYS.USERNAME, handle);
              districtFlowActive.current = true;
              setShowDistrictModal(true);
            }
          } else {
            const namePart = (fullName.split(' ')[0] || 'User').replace(/[^a-zA-Z0-9]/g, '');
            handle = `@${namePart}${getRandomHandleSuffix()}`;

            if (user.displayName !== handle) {
              await updateProfile(user, { displayName: handle });
            }
            storage.set(STORAGE_KEYS.USERNAME, handle);
            districtFlowActive.current = true;
            setShowDistrictModal(true);
          }
        } else {
          const pendingRedirect = sessionStorage.getItem('girify_redirect_pending');
          if (pendingRedirect) {
            sessionStorage.removeItem('girify_redirect_pending');
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

  // Check for missing district
  useEffect(() => {
    const checkDistrict = async () => {
      if (districtFlowActive.current) {
        return;
      }

      const currentUsername = username;
      if (!currentUsername || normalizeUsername(currentUsername).startsWith('guest')) {
        return;
      }

      if (checkedDistrictForUsername.current === currentUsername) {
        return;
      }

      checkedDistrictForUsername.current = currentUsername;

      try {
        const profile = await getUserProfile(currentUsername);
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
  }, [username]);

  const handleDistrictComplete = () => {
    setShowDistrictModal(false);
    if (username) {
      handleRegister(username);
    }
  };

  return {
    showDistrictModal,
    setShowDistrictModal,
    isProcessingRedirect,
    districtFlowActive,
    handleDistrictComplete,
  };
}

export default useAuthRedirect;
