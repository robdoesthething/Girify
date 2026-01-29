import React from 'react';
import { Button, Modal } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { ShopItem } from '../../../utils/shop';

interface FlavorModalProps {
  item: ShopItem | null;
  onClose: () => void;
  onPurchase: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  isOwned: boolean;
  isEquipped: boolean;
  balance: number;
}

const FlavorModal: React.FC<FlavorModalProps> = ({
  item,
  onClose,
  onPurchase,
  onEquip,
  isOwned,
  isEquipped,
  balance,
}) => {
  const { t } = useTheme();

  if (!item) {
    return null;
  }

  const cost = item.cost || item.price || 0;
  const canAfford = balance >= cost;

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      size="sm"
      title={t(item.name || '') || item.name}
      footer={
        <div className="flex gap-2 w-full">
          {isOwned ? (
            <Button
              onClick={() => {
                onEquip(item);
                onClose();
              }}
              variant={isEquipped ? 'ghost' : 'primary'}
              className="flex-1"
            >
              {isEquipped ? `✓ ${t('equipped')}` : t('equip')}
            </Button>
          ) : (
            <Button
              onClick={() => onPurchase(item)}
              disabled={!canAfford}
              variant={canAfford ? 'primary' : 'secondary'}
              className={`flex-1 ${canAfford ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}`}
            >
              {t('buy')}
            </Button>
          )}

          <Button onClick={onClose} variant="ghost">
            {t('close')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-5xl mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            item.prefix || item.emoji || '✨'
          )}
        </div>

        <div className="text-sm opacity-60 italic mb-6 px-4">
          &quot;
          {t(item.flavorText || '') ||
            item.flavorText ||
            t(item.description || '') ||
            item.description}
          &quot;
        </div>

        <div className="flex justify-center mb-2">
          {isOwned ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-sm">
              {t('owned')}
            </span>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full">
              <img src="/giuro.png" alt="" className="w-5 h-5" />
              <span className="font-bold text-yellow-600 dark:text-yellow-400">{cost}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FlavorModal;
