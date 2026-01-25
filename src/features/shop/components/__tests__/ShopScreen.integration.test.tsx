import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShopScreen from '../ShopScreen';

const mocks = vi.hoisted(() => ({
  handlePurchase: vi.fn(),
}));

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

vi.mock('../../hooks/useUnlockConditions', () => ({
  useUnlockConditions: () => ({
    checkUnlock: () => ({ locked: false, reason: null }),
  }),
}));

vi.mock('../../hooks/useShopData', () => ({
  useShopData: () => ({
    shopItems: {
      avatars: [
        { id: 'item1', name: 'Test Item', cost: 100, type: 'avatar', price: 100 },
        { id: 'item2', name: 'Expensive Item', cost: 1000, type: 'avatar', price: 1000 },
        { id: 'item3', name: 'Own Item', cost: 100, type: 'avatar', price: 100 },
      ],
      avatarFrames: [],
      titles: [],
      special: [],
    },
    balance: 500,
    purchased: ['item3'],
    equipped: {},
    userStats: { gamesPlayed: 10 },
    loading: false,
    error: null,
    setBalance: vi.fn(),
    setPurchased: vi.fn(),
    setEquipped: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePurchase', () => ({
  usePurchase: () => ({
    handlePurchase: mocks.handlePurchase,
  }),
}));

// Mock child components
vi.mock('../ShopItemCard', () => ({
  default: ({ item, onPurchase, isOwned, balance }: any) => {
    const canAfford = balance >= item.cost;
    return (
      <div data-testid={`shop-item-${item.id}`}>
        <span>{item.name}</span>
        <button
          onClick={() => onPurchase(item)}
          disabled={isOwned || !canAfford}
          data-testid={`buy-btn-${item.id}`}
        >
          {isOwned ? 'Owned' : 'Buy'}
        </button>
      </div>
    );
  },
}));

vi.mock('../FlavorModal', () => ({
  default: () => <div data-testid="flavor-modal" />,
}));
vi.mock('../../../components/ConfirmDialog', () => ({
  ConfirmDialog: ({ onConfirm, isOpen }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm} data-testid="confirm-buy">
          Confirm
        </button>
      </div>
    ) : null,
}));

import { MemoryRouter } from 'react-router-dom';

describe('ShopScreen Integration', () => {
  const defaultProps = {
    username: 'testuser',
    balance: 500,
    purchased: ['item3'], // item3 is owned
    setBalance: vi.fn(),
    setPurchased: vi.fn(),
    onClose: vi.fn(),
    userStats: { gamesPlayed: 10 },
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shop items correctly', () => {
    renderWithRouter(<ShopScreen {...defaultProps} />);
    expect(screen.getByTestId('shop-item-item1')).toBeInTheDocument();
    expect(screen.getByTestId('shop-item-item2')).toBeInTheDocument();
    expect(screen.getByTestId('shop-item-item3')).toBeInTheDocument();
  });

  it('handles item purchase flow', async () => {
    mocks.handlePurchase.mockResolvedValue(true);
    renderWithRouter(<ShopScreen {...defaultProps} />);

    // Click buy on item1 (affordable, not owned)
    const buyBtn = screen.getByTestId('buy-btn-item1');
    fireEvent.click(buyBtn);

    expect(mocks.handlePurchase).toHaveBeenCalledWith(expect.objectContaining({ id: 'item1' }));
  });

  it('disables buy button for owned items', () => {
    renderWithRouter(<ShopScreen {...defaultProps} />);
    const buyBtn = screen.getByTestId('buy-btn-item3');
    expect(buyBtn).toBeDisabled();
    expect(buyBtn).toHaveTextContent('Owned');
  });

  it('disables buy button for too expensive items', () => {
    // item2 cost 1000, balance 500
    renderWithRouter(<ShopScreen {...defaultProps} />);
    const buyBtn = screen.getByTestId('buy-btn-item2');
    expect(buyBtn).toBeDisabled();
  });
});
