/**
 * ShopItemCard Component
 *
 * Renders a single shop item card with purchase/equip functionality.
 */

import React from 'react';
import { getActionButtonClass, getItemCardClass } from '../../../utils/buttonClasses';
import type { ShopItem } from '../../../utils/shop';

interface ShopItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  isLocked: boolean;
  lockReason?: string;
  balance: number;
  activeTab: string;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  onPurchase: () => void;
  onEquip: () => void;
  onTitleClick?: () => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({
  item,
  isOwned,
  isEquipped,
  isLocked,
  lockReason,
  balance,
  activeTab,
  theme,
  t,
  onPurchase,
  onEquip,
  onTitleClick,
}) => {
  // Utility functions handled by buttonClasses.ts usage below

  const renderItemIcon = () => {
    if (item.cssClass) {
      return <div className={`w-10 h-10 rounded-full ${item.cssClass}`} />;
    }
    if (item.image) {
      return (
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-contain mix-blend-multiply"
          style={{ imageRendering: 'pixelated' }}
        />
      );
    }
    return <span style={{ fontSize: '1.5rem' }}>{item.prefix || item.emoji || '✨'}</span>;
  };

  const cost = item.cost || item.price || 0;
  const canAfford = balance >= cost;

  return (
    <div
      className={`relative flex flex-col p-4 rounded-2xl border transition-all h-full ${getItemCardClass(theme, isEquipped)} bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm`}
    >
      {/* Locked Overlay */}
      {isLocked && !isOwned && (
        <div className="absolute inset-0 z-10 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-4">
          <span className="text-2xl mb-2">🔒</span>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{lockReason}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center text-center mb-3 min-h-0">
        <div
          role="button"
          tabIndex={0}
          onClick={onTitleClick}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              onTitleClick?.();
            }
          }}
          className={`w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-3xl relative overflow-hidden shrink-0 ${activeTab === 'titles' ? 'cursor-pointer hover:scale-105 transition-transform shadow-md' : ''}`}
          style={{ imageRendering: 'pixelated' }}
        >
          {renderItemIcon()}
        </div>

        <h3 className="font-bold text-sm leading-tight font-inter mb-1.5 min-h-[1.25em]">
          {t(item.name || '') || item.name}
        </h3>
        <p className="text-xs opacity-60 font-inter leading-relaxed">
          {activeTab === 'titles' && item.flavorText
            ? `"${item.flavorText}"`
            : t(item.description || '') || item.description}
        </p>
      </div>

      <div className="mt-auto pt-2 w-full">
        {isOwned ? (
          activeTab !== 'special' && (
            <button
              onClick={onEquip}
              className={`w-full py-2 rounded-xl font-bold text-xs transition-all font-inter shadow-sm ${getActionButtonClass(theme, isEquipped)}`}
              type="button"
            >
              {isEquipped ? `✓ ${t('equipped')}` : t('equip')}
            </button>
          )
        ) : (
          <button
            onClick={onPurchase}
            disabled={!canAfford || isLocked}
            className={`w-full py-2 rounded-xl font-bold text-xs transition-all font-inter flex items-center justify-center gap-2
              ${
                isLocked
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-0'
                  : canAfford
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20 transform active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            type="button"
          >
            <img src="/giuro.png" alt="" className="h-3 w-auto object-contain opacity-80" />
            {cost}
          </button>
        )}
      </div>
    </div>
  );
};

ShopItemCard.displayName = 'ShopItemCard';

export default ShopItemCard;
