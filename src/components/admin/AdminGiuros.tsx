import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile } from '../../types/user';
import { getPayoutConfig, PayoutConfig, updatePayoutConfig } from '../../services/db/config';
import { ShopItem } from '../../utils/shop';
import EconomyMetrics from './EconomyMetrics';
import IncomeConfig from './IncomeConfig';
import RichestUsers from './RichestUsers';
import ShopPriceEditor from './ShopPriceEditor';

interface AdminGiurosProps {
  users: UserProfile[];
  shopItems: { all: ShopItem[] };
  theme: 'light' | 'dark';
  onUpdateShopItem?: (id: string, updates: Partial<ShopItem>) => Promise<void>;
}

const AdminGiuros: React.FC<AdminGiurosProps> = ({
  users = [],
  shopItems = { all: [] },
  theme,
  onUpdateShopItem,
}) => {
  // Payout config state
  const [payouts, setPayouts] = useState<PayoutConfig | null>(null);

  // Fetch payout config on mount
  useEffect(() => {
    getPayoutConfig().then((config: PayoutConfig) => {
      setPayouts(config);
    });
  }, []);

  // Calculate Economy Stats
  const stats = useMemo(() => {
    const totalCirculation = users.reduce((acc, u) => acc + (u.giuros || 0), 0);
    const avgBalance = users.length > 0 ? Math.round(totalCirculation / users.length) : 0;

    // Sort users by wealth
    const richest = [...users].sort((a, b) => (b.giuros || 0) - (a.giuros || 0)).slice(0, 5);

    return {
      totalCirculation,
      avgBalance,
      richest,
    };
  }, [users]);

  // Handler for saving payout config
  const handleSavePayouts = async (newConfig: PayoutConfig) => {
    const result = await updatePayoutConfig(newConfig);
    if (result.success) {
      setPayouts(newConfig);
      // Optional: show toast via prop if available, or just console log as before
      // console.log('Payout configuration saved successfully!');
    } else {
      console.error(`Failed to save: ${result.error || 'Unknown error'}`);
    }
  };

  // Handler for updating shop item price
  const handleUpdatePrice = (item: ShopItem, newPrice: number) => {
    if (onUpdateShopItem) {
      onUpdateShopItem(item.id, { cost: newPrice });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-black">Giuros Economics</h2>

      {/* High-Level Metrics */}
      <EconomyMetrics
        stats={stats}
        payouts={payouts}
        shopItemsCount={shopItems.all?.length || 0}
        theme={theme}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Sources (Editable) */}
        <IncomeConfig payouts={payouts} onSave={handleSavePayouts} theme={theme} />

        {/* Sinks (Shop Prices) */}
        <ShopPriceEditor items={shopItems.all} onUpdatePrice={handleUpdatePrice} theme={theme} />
      </div>

      {/* Richest Users */}
      <RichestUsers users={stats.richest} theme={theme} />
    </div>
  );
};

export default AdminGiuros;
