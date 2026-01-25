import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopItem } from '../../../../utils/shop';
import ShopItemCard from '../ShopItemCard';

// Mock dependencies
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    t: (key: string) => key,
  }),
}));

describe('ShopItemCard', () => {
  const item: ShopItem = {
    id: 'item1',
    name: 'Test Item',
    price: 100,
    type: 'avatar',
    description: 'A test item',
  };

  const defaultProps = {
    item,
    isOwned: false,
    isEquipped: false,
    isLocked: false,
    balance: 500,
    activeTab: 'avatars',
    onPurchase: vi.fn(),
    onEquip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders item details correctly', () => {
    render(<ShopItemCard {...defaultProps} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('A test item')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // Price
  });

  it('enables buy button if affordable', () => {
    render(<ShopItemCard {...defaultProps} balance={200} />);
    const buyBtn = screen.getByRole('button', { name: /100/i });
    expect(buyBtn).toBeEnabled();
  });

  it('disables buy button if not affordable', () => {
    render(<ShopItemCard {...defaultProps} balance={50} />);
    const buyBtn = screen.getByRole('button', { name: /100/i });
    expect(buyBtn).toBeDisabled();
  });

  it('calls onPurchase when buy button clicked', () => {
    render(<ShopItemCard {...defaultProps} />);
    const buyBtn = screen.getByRole('button', { name: /100/i });
    fireEvent.click(buyBtn);
    expect(defaultProps.onPurchase).toHaveBeenCalled();
  });

  it('shows equipped status when owned and equipped', () => {
    render(<ShopItemCard {...defaultProps} isOwned={true} isEquipped={true} />);
    expect(screen.getByText('✓ equipped')).toBeInTheDocument();
  });

  it('shows equip button when owned but not equipped', () => {
    render(<ShopItemCard {...defaultProps} isOwned={true} isEquipped={false} />);
    expect(screen.getByText('equip')).toBeInTheDocument();
  });

  it('calls onEquip when equip button clicked', () => {
    render(<ShopItemCard {...defaultProps} isOwned={true} isEquipped={false} />);
    const equipBtn = screen.getByText('equip');
    fireEvent.click(equipBtn);
    expect(defaultProps.onEquip).toHaveBeenCalled();
  });

  it('shows lock overlay if locked', () => {
    render(<ShopItemCard {...defaultProps} isLocked={true} lockReason="Level 5 required" />);
    expect(screen.getByText('Level 5 required')).toBeInTheDocument();
    // Buy button should be disabled or hidden?
    // In implementation: disabled={!canAfford || isLocked}
    const buyBtn = screen.getByRole('button', { name: /100/i });
    expect(buyBtn).toBeDisabled();
  });
});
