import { TOAST_SHORT_MS } from '../../../config/appConstants';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../hooks/useToast';
import { ShopItem } from '../../../utils/shop';
import { setEquippedCosmetics as updateEquippedInDb } from '../../../utils/shop/giuros';
import { EquippedCosmetics } from './useShopData';

interface UseEquipProps {
  username: string;
  equipped: EquippedCosmetics;
  setEquipped: (equipped: EquippedCosmetics) => void;
}

export const useEquip = ({ username, equipped, setEquipped }: UseEquipProps) => {
  const { success: showSuccess } = useToast();
  const { t } = useTheme();

  const handleEquip = async (item: ShopItem) => {
    const newEquipped = { ...equipped };
    let changed = false;

    // Determine category based on item type
    if (item.type === 'frame') {
      newEquipped.frameId = item.id;
      changed = true;
    } else if (item.type === 'title') {
      newEquipped.titleId = item.id;
      changed = true;
    } else if (item.type === 'avatar' || item.type === 'avatars') {
      newEquipped.avatarId = item.id;
      changed = true;
    }

    if (changed) {
      await updateEquippedInDb(username, newEquipped);
      setEquipped(newEquipped);
      showSuccess(`${t('equipped')} ${item.name}!`, TOAST_SHORT_MS);
      return true;
    }

    return false;
  };

  return { handleEquip };
};
