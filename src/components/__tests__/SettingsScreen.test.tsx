import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsScreen from '../SettingsScreen';

// Mock dependencies
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    t: (key: string) => key,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../../firebase', () => ({
  auth: { currentUser: { uid: 'testuser' } },
  db: {},
  messaging: {},
}));

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

// Mock Profile Service to avoid DB calls
vi.mock('../../utils/social/profile', () => ({
  ensureUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

// Mock DB services if needed (users)
vi.mock('../../services/db/users', () => ({
  getUserByUsername: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock child components that might use complex logic
vi.mock('../settings/AccountSettings', () => ({
  default: ({ onLogout }: any) => (
    <div data-testid="account-settings">
      <button onClick={onLogout}>logout</button>
    </div>
  ),
}));
vi.mock('../settings/AppearanceSettings', () => ({
  default: ({ username }: any) => <div>Appearance: {username}</div>,
}));
vi.mock('../settings/GameplaySettings', () => ({
  default: ({ setAutoAdvance }: any) => (
    <button role="switch" onClick={() => setAutoAdvance(false)}>
      toggle
    </button>
  ),
}));
vi.mock('../settings/LanguageSettings', () => ({ default: () => <div>Language</div> }));
vi.mock('../settings/NotificationSettings', () => ({ default: () => <div>Notification</div> }));

describe('SettingsScreen', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onLogout: vi.fn(),
    autoAdvance: true,
    setAutoAdvance: vi.fn(),
    username: 'testuser',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SettingsScreen {...defaultProps} />);
    expect(screen.getByText('settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance: testuser')).toBeInTheDocument();
  });

  it('handles close button click', () => {
    render(<SettingsScreen {...defaultProps} />);
    const closeBtn = screen.getByLabelText('close');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles logout button click', () => {
    render(<SettingsScreen {...defaultProps} />);
    const logoutBtn = screen.getByText('logout');
    fireEvent.click(logoutBtn);
    expect(defaultProps.onLogout).toHaveBeenCalled();
  });

  it('toggles auto-advance', () => {
    render(<SettingsScreen {...defaultProps} />);
    // Find the toggle (checkbox or button). Implementation detail required.
    // Assuming standard checkbox or switch with role "checkbox" or similar label.
    // Code says: <button ... onClick={() => setAutoAdvance(!autoAdvance)}>
    // Label: "Auto-advance Questions"
    const toggleBtn = screen.getByRole('switch');
    fireEvent.click(toggleBtn);
    expect(defaultProps.setAutoAdvance).toHaveBeenCalledWith(false);
  });
});
