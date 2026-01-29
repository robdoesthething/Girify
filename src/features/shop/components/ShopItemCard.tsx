/**
 * ShopItemCard Component
 *
 * Renders a single shop item card with purchase/equip functionality.
 */

import React, { memo } from 'react';
import { Button, Card, Heading, Text } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { getItemCardClass } from '../../../utils/buttonClasses';
import type { ShopItem } from '../../../utils/shop';

interface ShopItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  isLocked: boolean;
  lockReason?: string;
  balance: number;
  activeTab: string;
  onPurchase: () => void;
  onEquip: () => void;
  onTitleClick?: () => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = memo(
  ({
    item,
    isOwned,
    isEquipped,
    isLocked,
    lockReason,
    balance,
    activeTab,
    onPurchase,
    onEquip,
    onTitleClick,
  }) => {
    const { theme, t } = useTheme();

    const renderItemIcon = () => {
      if (item.cssClass) {
        return <div className={`w-10 h-10 rounded-full ${item.cssClass}`} />;
      }
      if (item.image) {
        return (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        );
      }
      return <span style={{ fontSize: '1.5rem' }}>{item.prefix || item.emoji || '✨'}</span>;
    };

    const cost = item.cost || item.price || 0;
    const canAfford = balance >= cost;

    // We reuse getItemCardClass for the specific border logic which is complex
    const cardClasses = getItemCardClass(theme, isEquipped);

    return (
      <Card
        className={`relative flex flex-col !p-4 transition-all h-full ${cardClasses} bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm`}
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
            className={`w-16 h-16 mb-3 flex items-center justify-center text-3xl relative overflow-hidden shrink-0 rounded-2xl bg-transparent ${activeTab === 'titles' ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            style={{ imageRendering: 'pixelated' }}
          >
            {renderItemIcon()}
          </div>

          <Heading variant="h6" className="leading-tight mb-1.5 min-h-[1.25em]">
            {t(item.name || '') || item.name}
          </Heading>

          <Text variant="caption" className="opacity-60 leading-relaxed !mb-0">
            {activeTab === 'titles' && item.flavorText
              ? `"${item.flavorText}"`
              : t(item.description || '') || item.description}
          </Text>
        </div>

        <div className="mt-auto pt-2 w-full">
          {isOwned ? (
            activeTab !== 'special' && (
              <Button
                onClick={onEquip}
                variant={isEquipped ? 'ghost' : 'secondary'}
                size="sm"
                fullWidth
                className={
                  isEquipped ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''
                }
              >
                {isEquipped ? `✓ ${t('equipped')}` : t('equip')}
              </Button>
            )
          ) : (
            <Button
              onClick={onPurchase}
              disabled={!canAfford || isLocked}
              variant={canAfford && !isLocked ? 'primary' : 'secondary'}
              size="sm"
              fullWidth
              className={`flex items-center justify-center gap-2 ${
                !canAfford || isLocked
                  ? '!bg-slate-200 dark:!bg-slate-700 !text-slate-400 opacity-50'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20'
              }`}
            >
              <img src="/giuro.png" alt="" className="h-3 w-auto object-contain opacity-80" />
              {cost}
            </Button>
          )}
        </div>
      </Card>
    );
  }
);

ShopItemCard.displayName = 'ShopItemCard';

export default ShopItemCard;
