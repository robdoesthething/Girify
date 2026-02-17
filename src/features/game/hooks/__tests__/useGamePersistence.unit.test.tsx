import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGamePersistence } from '../useGamePersistence';

// Mock dependencies
const mockSaveUserGameResult = vi.fn();
const mockUpdateUserGameStats = vi.fn();

vi.mock('../../../utils/social', () => ({
  saveUserGameResult: (...args: any[]) => mockSaveUserGameResult(...args),
  updateUserGameStats: (...args: any[]) => mockUpdateUserGameStats(...args),
  getReferrer: vi.fn(),
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

vi.mock('../../../services/db/games', () => ({
  insertGameResult: vi.fn().mockResolvedValue({ success: true }),
}));

// Correct path: ../../../../hooks/useAsyncOperation because we are in src/features/game/hooks/__tests__
vi.mock('../../../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    execute: vi.fn(fn => fn()),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../../../hooks/useNotification', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

describe('useGamePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    const { result } = renderHook(() => useGamePersistence(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    expect(result.current).toBeDefined();
    expect(result.current.saveGameResults).toBeDefined();
  });
});
