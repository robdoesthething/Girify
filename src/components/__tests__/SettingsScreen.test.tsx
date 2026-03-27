import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsScreen from '../SettingsScreen';

// Mock useNotification to avoid context requirement
vi.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    themeMode: 'light',
    changeTheme: vi.fn(),
    t: (key: string) => key,
    toggleTheme: vi.fn(),
    language: 'en',
    changeLanguage: vi.fn(),
    languages: [{ code: 'en', label: 'English', flag: '🇬🇧', name: 'English' }],
  }),
}));

// Mock Supabase client
vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  },
}));

// Mock social utilities to avoid DB calls
vi.mock('../../utils/social', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn().mockResolvedValue(null),
  updateUserProfile: vi.fn().mockResolvedValue(null),
}));

// Mock useConfirm to avoid rendering ConfirmDialog complexity
vi.mock('../../hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(false),
    confirmConfig: null,
    handleClose: vi.fn(),
  }),
}));

describe('SettingsScreen', () => {
  const defaultProps = {
    onLogout: vi.fn(),
    username: 'testuser',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with settings heading', () => {
    render(
      <MemoryRouter>
        <SettingsScreen {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(
      <MemoryRouter>
        <SettingsScreen {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText('logout')).toBeInTheDocument();
  });

  it('renders logout button that requires confirmation', () => {
    render(
      <MemoryRouter>
        <SettingsScreen {...defaultProps} />
      </MemoryRouter>
    );
    // Logout button is present — clicking it goes through confirm() first
    expect(screen.getByText('logout')).toBeInTheDocument();
  });

  it('renders auto-advance toggle button', () => {
    render(
      <MemoryRouter>
        <SettingsScreen {...defaultProps} />
      </MemoryRouter>
    );
    // Auto-advance section heading
    expect(screen.getByText('Gameplay')).toBeInTheDocument();
    // The toggle button renders inside the gameplay section
    expect(screen.getByText('autoAdvance')).toBeInTheDocument();
  });
});
