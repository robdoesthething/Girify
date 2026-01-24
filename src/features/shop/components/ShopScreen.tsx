import { AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/TopBar';
import { useTheme } from '../../../context/ThemeContext';
import { useTabs } from '../../../hooks/useTabs';
import { useToast } from '../../../hooks/useToast';
import { getTabButtonClass } from '../../../utils/buttonClasses';
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

  const tabs: {
    id: 'avatars' | 'frames' | 'titles' | 'special';
    label: string;
    items: ShopItem[];
  }[] = [
    { id: 'avatars', label: `👤 ${t('avatars') || 'Avatars'}`, items: shopItems.avatars || [] },
    { id: 'frames', label: `🖼️ ${t('frames')}`, items: shopItems.avatarFrames || [] },
    { id: 'titles', label: `🏷️ ${t('titles')}`, items: shopItems.titles || [] },
    { id: 'special', label: `✨ ${t('special')}`, items: shopItems.special || [] },
  ];

  const activeItems = (tabs.find(t_ => t_.id === activeTab)?.items || []).filter(i => !!i);

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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10"
              type="button"
              aria-label={t('back')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('back')}
            </button>
            <h1 className="text-xl font-black absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 font-inter">
              <span>🛒</span> {t('shop')}
            </h1>

            <div
              className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-lg"
              aria-label={`Balance: ${balance} Giuros`}
            >
              <img src="/giuro.png" alt="" className="h-6 w-auto object-contain" />
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all font-inter ${getTabButtonClass(theme, activeTab === tab.id)}`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500" />
            </div>
          ) : !username ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold mb-2 font-inter">
                {t('loginRequired') || 'Login Required'}
              </h2>
              <p className="text-slate-500 mb-6">
                {t('loginToShop') || 'Please log in to access the shop.'}
              </p>
              <button
                onClick={() => navigate('/?auth=login')}
                className="px-6 py-3 rounded-xl bg-sky-500 text-white font-bold font-inter hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
              >
                {t('login') || 'Log In'}
              </button>
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
            onPurchase={() => {
              handlePurchase(flavorModal);
              setFlavorModal(null); // Assuming close on buy, or keep open? Original was conditionally button.
              // Wait, FlavorModal buttons call onPurchase/onEquip.
              // FlavorModal props: onPurchase, onEquip.
              // handlePurchase/Equip are async, but here we just trigger them.
            }}
            onEquip={() => handleEquip(flavorModal)}
            isOwned={isOwned(flavorModal.id)}
            isEquipped={isEquipped(flavorModal.id)}
            balance={balance}
            theme={theme}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopScreen;
