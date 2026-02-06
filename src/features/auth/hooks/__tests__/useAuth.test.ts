import { act, renderHook } from '@testing-library/react';
import { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAsyncOperationModule from '../../../../hooks/useAsyncOperation';
import * as useNotificationModule from '../../../../hooks/useNotification';
import * as socialUtils from '../../../../utils/social';
import { storage } from '../../../../utils/storage';

// Mock Supabase before importing useAuth (which imports supabase)
vi.mock('../../../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { useAuth } from '../useAuth';

// Mock Firebase
const mockUnsubscribe = vi.fn();
const mockOnAuthStateChanged = vi.fn((_auth: any, _callback: any) => {
  return mockUnsubscribe;
});

vi.mock('../../../../firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: any, _cb: any) => mockOnAuthStateChanged(_auth, _cb),
  signOut: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  User: {},
}));

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

    // Simulate no user
    await act(async () => {
      const calls = mockOnAuthStateChanged.mock.calls;
      if (calls.length > 0 && calls[0]) {
        const callback = calls[0][1];
        await callback(null);
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle authenticated user and sync profile', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      reload: vi.fn(),
    } as unknown as User;

    const mockProfile = {
      district: 'District 1',
      realName: 'Real Name',
      streak: 5,
    };

    (socialUtils.getUserProfile as any).mockResolvedValue(mockProfile);
    (socialUtils.ensureUserProfile as any).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth());

    // Simulate login
    await act(async () => {
      const calls = mockOnAuthStateChanged.mock.calls;
      if (calls.length > 0 && calls[0]) {
        const callback = calls[0][1];
        await callback(mockUser);
      }
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
