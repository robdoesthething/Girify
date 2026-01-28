import { act, renderHook } from '@testing-library/react';
import { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAsyncOperationModule from '../../../../hooks/useAsyncOperation';
import * as useNotificationModule from '../../../../hooks/useNotification';
import * as socialUtils from '../../../../utils/social';
import { storage } from '../../../../utils/storage';
import { useAuth } from '../useAuth';

// Mock Firebase
const mockUnsubscribe = vi.fn();
const mockOnAuthStateChanged = vi.fn((auth, callback) => {
  return mockUnsubscribe;
});

vi.mock('../../../../firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: any, cb: any) => mockOnAuthStateChanged(auth, cb),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
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
  const mockDispatch = vi.fn();
  const mockExecute = vi.fn(fn => fn()); // Execute immediately
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
    vi.spyOn(storage, 'get').mockImplementation((key, defaultValue) => defaultValue ?? null);
    vi.spyOn(storage, 'set').mockImplementation(() => {});
    vi.spyOn(storage, 'remove').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(mockDispatch, 'intro'));
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(mockDispatch, 'intro'));

    // Simulate no user
    await act(async () => {
      const callback = mockOnAuthStateChanged.mock.calls[0][1];
      await callback(null);
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

    const { result } = renderHook(() => useAuth(mockDispatch, 'intro'));

    // Simulate login
    await act(async () => {
      const callback = mockOnAuthStateChanged.mock.calls[0][1];
      await callback(mockUser);
    });

    expect(result.current.user).toBe(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_USERNAME',
        payload: expect.stringMatching(/@?testuser/),
      })
    );
    expect(socialUtils.ensureUserProfile).toHaveBeenCalled();
  });

  it('should logout user', async () => {
    // Setup authenticated state first if needed, or just test handleLogout
    const { result } = renderHook(() => useAuth(mockDispatch, 'intro'));

    const mockNavigate = vi.fn();

    await act(async () => {
      result.current.handleLogout(mockNavigate);
    });

    expect(mockExecute).toHaveBeenCalled();
    // Since mockExecute executes immediately:
    const { signOut } = await import('firebase/auth');
    expect(signOut).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
