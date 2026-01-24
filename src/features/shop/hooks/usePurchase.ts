import { TOAST_SHORT_MS, TOAST_TIMEOUT_MS } from '../../../config/appConstants';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../hooks/useToast';
import { spendGiuros } from '../../../utils/giuros';
import { checkUnlockCondition, ShopItem } from '../../../utils/shop';
import { UserStats } from './useShopData';

interface UsePurchaseProps {
  username: string;
  balance: number;
  purchased: string[];
  setBalance: (balance: number) => void;
  setPurchased: (purchased: string[] | ((prev: string[]) => string[])) => void;
  userStats: UserStats | null;
}

export const usePurchase = ({
  username,
  balance,
  purchased,
  setBalance,
  setPurchased,
  userStats,
}: UsePurchaseProps) => {
  const { error: showError, success: showSuccess } = useToast();
  const { t } = useTheme();

  const handlePurchase = async (item: ShopItem) => {
    if (purchased.includes(item.id)) {
      showError(t('alreadyOwned'), TOAST_SHORT_MS);
      return false;
    }

    const { locked, reason } = checkUnlockCondition(item, userStats);
    if (locked) {
      showError(`Locked! ${reason}`, TOAST_TIMEOUT_MS);
      return false;
    }

    const cost = item.cost || item.price || 0;
    if (balance < cost) {
      showError(t('notEnoughGiuros'), TOAST_SHORT_MS);
      return false;
    }

    const result = await spendGiuros(username, cost, item.id);
    if (result.success) {
      setBalance(result.newBalance ?? balance);
      setPurchased(prev => [...prev, item.id]);
      showSuccess(`${t('purchased') || 'Purchased'} ${item.name}!`, TOAST_SHORT_MS);
      return true;
    } else {
      showError(result.error || t('purchaseFailed') || 'Purchase failed', TOAST_SHORT_MS);
      return false;
    }
  };

  return { handlePurchase };
};
