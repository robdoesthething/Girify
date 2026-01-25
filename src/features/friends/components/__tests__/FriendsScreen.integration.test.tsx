import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FriendsScreen from '../FriendsScreen';

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  sendRequest: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  removeFriend: vi.fn(),
  search: vi.fn(),
}));

// Mock dependencies
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    t: (key: string) => key,
  }),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../../hooks/useFriends', () => ({
  useFriends: () => ({
    friends: [{ username: 'friend1', avatarId: 1, badges: [] }],
    requests: [{ id: 'req1', from: 'requester1', avatarId: 2, timestamp: { seconds: 123 } }],
    searchResults: [],
    loading: false,
    searching: false,
    error: null,
    search: mocks.search,
    sendRequest: mocks.sendRequest,
    acceptRequest: mocks.acceptRequest,
    declineRequest: mocks.declineRequest,
    removeFriend: mocks.removeFriend,
    loadFriends: vi.fn(),
    loadRequests: vi.fn(),
    loadFeed: vi.fn(),
  }),
}));

vi.mock('../../../utils/social/friends', () => ({
  // Mocking imports that might be used by children if not fully mocked
}));

// Mock child components if needed, OR verify through DOM
// FriendsScreen renders: TopBar, SearchPanel, FriendsList, RequestsList, FeedList
// Use shallow/mock for complex children

vi.mock('../../../components/TopBar', () => ({
  default: () => <div data-testid="top-bar">TopBar</div>,
}));

vi.mock('../SearchPanel', () => ({
  default: ({ onSearch }: any) => (
    <div data-testid="search-panel">
      <input data-testid="search-input" onChange={e => onSearch(e.target.value)} />
    </div>
  ),
}));

vi.mock('../FriendsList', () => ({
  default: ({ friends, onRemove }: any) => (
    <div data-testid="friends-list">
      {friends.map((f: any) => (
        <div key={f.username} data-testid={`friend-${f.username}`}>
          {f.username}
          <button onClick={() => onRemove(f.username)} data-testid={`remove-${f.username}`}>
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../RequestsList', () => ({
  default: ({ requests, onAccept, onDecline }: any) => (
    <div data-testid="requests-list">
      {requests.map((r: any) => (
        <div key={r.from} data-testid={`request-${r.from}`}>
          {r.from}
          <button onClick={() => onAccept(r.from)} data-testid={`accept-${r.from}`}>
            Accept
          </button>
          <button onClick={() => onDecline(r.from)} data-testid={`decline-${r.from}`}>
            Decline
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../FeedList', () => ({
  default: () => <div data-testid="feed-list">Feed</div>,
}));

import { MemoryRouter } from 'react-router-dom';

describe('FriendsScreen Integration', () => {
  const defaultProps = {
    username: 'testuser',
    onClose: vi.fn(),
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders friends and requests', () => {
    renderWithRouter(<FriendsScreen {...defaultProps} />);
    const friendsTab = screen.getByRole('button', { name: /Friends/i });
    fireEvent.click(friendsTab);
    expect(screen.getByTestId('friend-friend1')).toBeInTheDocument();

    // Requests might have a badge, so regex match is good.
    const requestsTab = screen.getByRole('button', { name: /Requests/i });
    fireEvent.click(requestsTab);
    expect(screen.getByTestId('request-requester1')).toBeInTheDocument();
  });

  it('handles accept request flow', () => {
    renderWithRouter(<FriendsScreen {...defaultProps} />);
    const requestsTab = screen.getByRole('button', { name: /Requests/i });
    fireEvent.click(requestsTab);
    const acceptBtn = screen.getByTestId('accept-requester1');
    fireEvent.click(acceptBtn);
    expect(mocks.acceptRequest).toHaveBeenCalledWith('requester1');
  });

  it('handles decline request flow', () => {
    renderWithRouter(<FriendsScreen {...defaultProps} />);
    const requestsTab = screen.getByRole('button', { name: /Requests/i });
    fireEvent.click(requestsTab);
    const declineBtn = screen.getByTestId('decline-requester1');
    fireEvent.click(declineBtn);
    expect(mocks.declineRequest).toHaveBeenCalledWith('requester1');
  });

  it('handles remove friend flow', () => {
    renderWithRouter(<FriendsScreen {...defaultProps} />);
    const friendsTab = screen.getByRole('button', { name: /Friends/i });
    fireEvent.click(friendsTab);
    const removeBtn = screen.getByTestId('remove-friend1');
    fireEvent.click(removeBtn);
    expect(mocks.removeFriend).toHaveBeenCalledWith('friend1');
  });

  it('handles search input', () => {
    renderWithRouter(<FriendsScreen {...defaultProps} />);
    const friendsTab = screen.getByRole('button', { name: /Friends/i });
    fireEvent.click(friendsTab);
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'query' } });
    expect(mocks.search).toHaveBeenCalledWith('query');
  });
});
