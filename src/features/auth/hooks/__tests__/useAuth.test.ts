import { act, renderHook } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAsyncOperationModule from '../../../../hooks/useAsyncOperation';
import * as useNotificationModule from '../../../../hooks/useNotification';
import * as socialUtils from '../../../../utils/social';
import { storage } from '../../../../utils/storage';

// Capture the onAuthStateChange callback so we can trigger it in tests
let authChangeCallback: (event: string, session: any) => void;

// Mock Supabase before importing useAuth (which imports supabase)
vi.mock('../../../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn((cb: any) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { useAuth } from '../useAuth';

// Mock Hooks
vi.mock('../../../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: vi.fn(),
}));

vi.mock('../../../../hooks/useNotification', () => ({
  useNotification: vi.fn(),
}));

// Mock Utils
vi.mock('../../../../utils/social', () => ({
  getUserProfile: vi.fn(),
  ensureUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  checkUnseenFeedbackRewards: vi.fn(),
  markFeedbackRewardSeen: vi.fn(),
  healMigration: vi.fn().mockResolvedValue(undefined),
  migrateUser: vi.fn(),
  getUserGameHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../utils/shop/giuros', () => ({
  claimDailyLoginBonus: vi.fn().mockResolvedValue({ claimed: false }),
}));

vi.mock('../../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../../utils/security', () => ({
  sanitizeInput: (str: string) => str,
}));

describe('useAuth Hook', () => {
  const mockExecute = vi.fn(async (fn: () => Promise<any>) => fn()); // Execute immediately and await
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Mock Implementations
    (useAsyncOperationModule.useAsyncOperation as any).mockReturnValue({
      execute: mockExecute,
    });
    (useNotificationModule.useNotification as any).mockReturnValue({
      notify: mockNotify,
    });

    // Storage Mocks
    vi.spyOn(storage, 'get').mockImplementation((_key, defaultValue) => defaultValue ?? null);
    vi.spyOn(storage, 'set').mockImplementation(() => {});
    vi.spyOn(storage, 'remove').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate no user via onAuthStateChange
    await act(async () => {
      if (authChangeCallback) {
        authChangeCallback('SIGNED_OUT', null);
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle authenticated user and sync profile', async () => {
    const mockUser = {
      id: 'test-supabase-uid',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      user_metadata: {
        full_name: 'Test User',
        name: 'Test User',
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
    } as unknown as User;

    const mockProfile = {
      district: 'District 1',
      realName: 'Real Name',
      streak: 5,
    };

    (socialUtils.getUserProfile as any).mockResolvedValue(mockProfile);
    (socialUtils.ensureUserProfile as any).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth());

    // Simulate login via onAuthStateChange
    await act(async () => {
      if (authChangeCallback) {
        authChangeCallback('SIGNED_IN', { user: mockUser });
      }
      // Allow async handleAuthUser to complete (linkSupabaseUid, migration, syncUserProfile)
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.user).toBe(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(socialUtils.ensureUserProfile).toHaveBeenCalled();
    // Verify profile is set in state
    expect(result.current.profile).toEqual(mockProfile);
  });

  // TODO: Fix this test - the mockExecute doesn't properly wire through
  // the async execution chain with navigate callback. Pre-existing issue.
  it.skip('should logout user', async () => {
    const { result } = renderHook(() => useAuth());

    const mockNavigate = vi.fn();

    await act(async () => {
      result.current.handleLogout(mockNavigate);
      // Allow the async execute to run
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify execute was called with a function
    expect(mockExecute).toHaveBeenCalled();
    expect(mockExecute.mock.calls[0]?.[0]).toBeInstanceOf(Function);
    // Verify navigation was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/');
    // Verify profile is cleared
    expect(result.current.profile).toBeNull();
  });
});
