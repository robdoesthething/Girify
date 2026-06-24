/**
 * Tests for authSyncHelpers.ts
 * Covers:
 *  - syncUserProfile: sets girify_onboarding_completed when games_played > 0
 *  - syncUserProfile: does NOT set that key when games_played = 0 and no metadata
 *  - backfillJoinDate: sets STORAGE_KEYS.JOINED when profile.joinedAt exists
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../../../../config/constants';
import * as socialUtils from '../../../../utils/social';

// ------------------------------------------------------------------
// Storage mock — must use vi.hoisted so the factory can reference the fns
// before vi.mock is hoisted to the top of the file.
// ------------------------------------------------------------------
const { mockStorageGet, mockStorageSet } = vi.hoisted(() => ({
  mockStorageGet: vi.fn(),
  mockStorageSet: vi.fn(),
}));

vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: mockStorageGet,
    set: mockStorageSet,
    remove: vi.fn(),
  },
}));

// ------------------------------------------------------------------
// Social utils mock
// ------------------------------------------------------------------
vi.mock('../../../../utils/social', () => ({
  getUserProfile: vi.fn(),
  ensureUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  checkUnseenFeedbackRewards: vi.fn(),
  markFeedbackRewardSeen: vi.fn(),
  healMigration: vi.fn().mockResolvedValue(undefined),
  getUserGameHistory: vi.fn(),
}));

vi.mock('../../../../utils/shop/giuros', () => ({
  claimDailyLoginBonus: vi.fn().mockResolvedValue({ claimed: false }),
  awardGiuros: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('../../../../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

import { backfillJoinDate, syncUserProfile } from '../authSyncHelpers';

// Minimal mock Supabase User
const mockUser: any = {
  id: 'test-uid',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
  email_confirmed_at: new Date().toISOString(),
};

describe('syncUserProfile – onboarding skip for returning users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: storage returns empty/false values
    mockStorageGet.mockReturnValue(false);
  });

  it('sets girify_onboarding_completed when games_played > 0', async () => {
    const profile = { games_played: 5, metadata: null };
    (socialUtils.getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (socialUtils.ensureUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (socialUtils.checkUnseenFeedbackRewards as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncUserProfile('testuser', mockUser, undefined, null);

    expect(mockStorageSet).toHaveBeenCalledWith('girify_onboarding_completed', 'true');
  });

  it('sets girify_onboarding_completed when metadata.onboarding_completed is truthy', async () => {
    const profile = { games_played: 0, metadata: { onboarding_completed: true } };
    (socialUtils.getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (socialUtils.ensureUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (socialUtils.checkUnseenFeedbackRewards as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncUserProfile('testuser', mockUser, undefined, null);

    expect(mockStorageSet).toHaveBeenCalledWith('girify_onboarding_completed', 'true');
  });

  it('does NOT set girify_onboarding_completed when games_played = 0 and no metadata', async () => {
    const profile = { games_played: 0, metadata: null };
    (socialUtils.getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (socialUtils.ensureUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (socialUtils.checkUnseenFeedbackRewards as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await syncUserProfile('testuser', mockUser, undefined, null);

    // Must NOT have set the onboarding key (may set other keys from backfill/history)
    const onboardingCall = mockStorageSet.mock.calls.find(
      call => call[0] === 'girify_onboarding_completed'
    );
    expect(onboardingCall).toBeUndefined();
  });
});

describe('backfillJoinDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty history array for HISTORY key, empty string for JOINED key
    mockStorageGet.mockImplementation((key: string, def: unknown) => {
      if (key === STORAGE_KEYS.HISTORY) {
        return [];
      }
      if (key === STORAGE_KEYS.JOINED) {
        return '';
      }
      return def ?? '';
    });
  });

  it('sets STORAGE_KEYS.JOINED from profile.joinedAt when it exists', async () => {
    const joinDate = new Date('2024-01-15');
    const profile: any = { joinedAt: joinDate };

    await backfillJoinDate('testuser', profile);

    const joinedCalls = mockStorageSet.mock.calls.filter(call => call[0] === STORAGE_KEYS.JOINED);
    expect(joinedCalls.length).toBeGreaterThan(0);
    expect(joinedCalls[0]![1]).toContain('2024');
  });

  it('sets STORAGE_KEYS.JOINED from profile.joinedAt as string', async () => {
    const profile: any = { joinedAt: '2023-06-01T00:00:00Z' };

    await backfillJoinDate('testuser', profile);

    const joinedCalls = mockStorageSet.mock.calls.filter(call => call[0] === STORAGE_KEYS.JOINED);
    expect(joinedCalls.length).toBeGreaterThan(0);
  });

  it('sets STORAGE_KEYS.JOINED from Firestore-style timestamp object', async () => {
    const profile: any = { joinedAt: { seconds: new Date('2022-03-10').getTime() / 1000 } };

    await backfillJoinDate('testuser', profile);

    const joinedCalls = mockStorageSet.mock.calls.filter(call => call[0] === STORAGE_KEYS.JOINED);
    expect(joinedCalls.length).toBeGreaterThan(0);
  });

  it('falls back to today when profile has no joinedAt and no local history', async () => {
    // storage.get returns empty string for JOINED (not set yet)
    mockStorageGet.mockImplementation((key: string, def: unknown) => {
      if (key === STORAGE_KEYS.JOINED) {
        return '';
      }
      return def;
    });

    await backfillJoinDate('testuser', null);

    const joinedCalls = mockStorageSet.mock.calls.filter(call => call[0] === STORAGE_KEYS.JOINED);
    expect(joinedCalls.length).toBeGreaterThan(0);
  });

  it('uses the earliest local history timestamp when it is older than profile joinedAt', async () => {
    const veryOldDate = new Date('2020-01-01').getTime();
    const recentDate = new Date('2024-01-01');

    mockStorageGet.mockImplementation((key: string, def: unknown) => {
      if (key === STORAGE_KEYS.HISTORY) {
        return [{ timestamp: veryOldDate }];
      }
      if (key === STORAGE_KEYS.JOINED) {
        return '';
      }
      return def;
    });

    const profile: any = { joinedAt: recentDate };

    await backfillJoinDate('testuser', profile);

    expect(socialUtils.updateUserProfile).toHaveBeenCalledWith(
      'testuser',
      expect.objectContaining({ joinedAt: expect.any(Date) })
    );
  });
});
