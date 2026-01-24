import React from 'react';
import { ShopItem } from '../../../utils/shop';
import { themeClasses } from '../../../utils/themeUtils';

interface FlavorModalProps {
  item: ShopItem | null;
  onClose: () => void;
  onPurchase: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  isOwned: boolean;
  isEquipped: boolean;
  balance: number;
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const FlavorModal: React.FC<FlavorModalProps> = ({
  item,
  onClose,
  onPurchase,
  onEquip,
  isOwned,
  isEquipped,
  balance,
  theme,
  t,
}) => {
  if (!item) {
    return null;
  }

  const cost = item.cost || item.price || 0;
  const canAfford = balance >= cost;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className={`p-6 rounded-3xl w-full max-w-sm shadow-2xl transform transition-all relative ${themeClasses(theme, 'bg-slate-800 text-white', 'bg-white text-slate-900')}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-5xl mb-4 overflow-hidden">
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
          <h3 className="text-xl font-bold mb-1 font-inter">{t(item.name || '') || item.name}</h3>
          <div className="text-sm opacity-60 italic px-4 font-inter">
            &quot;
            {t(item.flavorText || '') ||
              item.flavorText ||
              t(item.description || '') ||
              item.description}
            &quot;
          </div>
        </div>

        <div className="flex justify-center mb-6">
          {isOwned ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-sm font-inter">
              {t('owned')}
            </span>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full font-inter">
              <img src="/giuro.png" alt="" className="w-5 h-5 font-inter" />
              <span className="font-bold text-yellow-600 dark:text-yellow-400">{cost}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isOwned ? (
            <button
              onClick={() => {
                onEquip(item);
                onClose();
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all font-inter ${isEquipped ? 'bg-emerald-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg'}`}
              type="button"
            >
              {isEquipped ? `✓ ${t('equipped')}` : t('equip')}
            </button>
          ) : (
            <button
              onClick={() => onPurchase(item)}
              disabled={!canAfford}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all font-inter ${canAfford ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              type="button"
            >
              {t('buy')}
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-inter"
            type="button"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlavorModal;
