import { AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/TopBar';
import { Button, Heading, Spinner, Tabs, Text } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { useTabs } from '../../../hooks/useTabs';
import { useToast } from '../../../hooks/useToast';
import { ShopItem } from '../../../utils/shop';
import { themeClasses } from '../../../utils/themeUtils';
import { useEquip } from '../hooks/useEquip';
import { usePurchase } from '../hooks/usePurchase';
import { useShopData } from '../hooks/useShopData';
import { useUnlockConditions } from '../hooks/useUnlockConditions';
import FlavorModal from './FlavorModal';
import ShopItemCard from './ShopItemCard';

interface ShopScreenProps {
  username: string;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();

  // Hooks
  const { activeTab, setTab } = useTabs<'avatars' | 'frames' | 'titles' | 'special'>('avatars');
  const { toast } = useToast();
  const {
    balance,
    setBalance,
    purchased,
    setPurchased,
    equipped,
    setEquipped,
    shopItems,
    userStats,
    loading,
  } = useShopData(username);

  const { handlePurchase } = usePurchase({
    username,
    balance: balance,
    purchased,
    setBalance,
    setPurchased,
    userStats,
  });

  const { handleEquip } = useEquip({
    username,
    equipped,
    setEquipped,
  });

  const { checkUnlock } = useUnlockConditions(userStats);

  const [flavorModal, setFlavorModal] = useState<ShopItem | null>(null);

  const tabs = [
    { id: 'avatars', label: t('avatars') || 'Avatars', icon: <span>👤</span> },
    { id: 'frames', label: t('frames'), icon: <span>🖼️</span> },
    { id: 'titles', label: t('titles'), icon: <span>🏷️</span> },
    { id: 'special', label: t('special'), icon: <span>✨</span> },
  ];

  const activeItems = (shopItems[activeTab as keyof typeof shopItems] || []).filter(i => !!i);

  const isOwned = (itemId: string) =>
    purchased.includes(itemId) ||
    (shopItems.avatars && shopItems.avatars.find(a => a.id === itemId)?.cost === 0);

  const isEquipped = (itemId: string) => {
    if (activeTab === 'frames') {
      return equipped.frameId === itemId;
    }
    if (activeTab === 'titles') {
      return equipped.titleId === itemId;
    }
    if (activeTab === 'avatars') {
      return equipped.avatarId === itemId;
    }
    return false;
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 overflow-y-auto w-full px-4 py-6 pt-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              }
              className="z-10"
            >
              {t('back')}
            </Button>

            <Heading
              variant="h3"
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 mb-0"
            >
              <span>🛒</span> {t('shop')}
            </Heading>

            <div
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 border shadow-lg ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200')}`}
              role="status"
              aria-label={`Balance: ${balance} Giuros`}
            >
              <img
                src="/giuro.png"
                alt=""
                aria-hidden="true"
                className="h-6 w-auto object-contain"
              />
              <div className="flex flex-col items-end leading-none">
                <span className="text-lg font-black text-yellow-500">{balance}</span>
                <span className="text-[10px] uppercase font-bold opacity-60 font-inter">
                  Giuros
                </span>
              </div>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`mb-4 p-3 rounded-xl text-center font-bold text-sm font-inter ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}
            >
              {toast.text}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={id => setTab(id as any)} />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : !username ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🔐</div>
              <Heading variant="h3" className="mb-2">
                {t('loginRequired') || 'Login Required'}
              </Heading>
              <Text className="mb-6 opacity-60">
                {t('loginToShop') || 'Please log in to access the shop.'}
              </Text>
              <Button
                variant="primary"
                onClick={() => navigate('/?auth=login')}
                className="shadow-lg shadow-sky-500/20"
              >
                {t('login') || 'Log In'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
              {activeItems.map(item => {
                const owned = isOwned(item.id);
                const active = isEquipped(item.id);
                const { locked, reason } = checkUnlock(item);

                return (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    isOwned={owned}
                    isEquipped={active}
                    isLocked={locked}
                    lockReason={reason}
                    balance={balance}
                    activeTab={activeTab}
                    onPurchase={() => handlePurchase(item)}
                    onEquip={() => handleEquip(item)}
                    onTitleClick={() => {
                      if (activeTab === 'titles') {
                        setFlavorModal(item);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {flavorModal && (
          <FlavorModal
            item={flavorModal}
            onClose={() => setFlavorModal(null)}
            onPurchase={item => {
              handlePurchase(item);
              // Do not setFlavorModal(null) here if you want to allow equip immediately after purchase in the same modal,
              // but FlavorModal handles rendering purchase vs equip button based on isOwned.
              // Usually we might want to keep it open or close it.
              // Original logic wasn't explicit inside modal logic, but here we likely want to keep it open or let user close.
            }}
            onEquip={item => handleEquip(item)}
            isOwned={isOwned(flavorModal.id)}
            isEquipped={isEquipped(flavorModal.id)}
            balance={balance}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopScreen;
