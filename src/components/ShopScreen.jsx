import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  getGiuros,
  spendGiuros,
  getPurchasedCosmetics,
  setEquippedCosmetics,
  getEquippedCosmetics,
} from '../utils/giuros';
import { getShopItems } from '../utils/shop';
import TopBar from './TopBar';
import PropTypes from 'prop-types';

const ShopScreen = ({ username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [activeTab, setActiveTab] = useState('frames');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [flavorModal, setFlavorModal] = useState(null);
  const [shopItems, setShopItems] = useState({ avatarFrames: [], titles: [], special: [] });

  useEffect(() => {
    const loadData = async () => {
      if (!username) return;
      setLoading(true);
      const [bal, owned, eq, items] = await Promise.all([
        getGiuros(username),
        getPurchasedCosmetics(username),
        getEquippedCosmetics(username),
        getShopItems(),
      ]);
      setBalance(bal);
      setPurchased(owned);
      setEquipped(eq);
      setShopItems(items);
      setLoading(false);
    };
    loadData();
  }, [username]);

  const handlePurchase = async (item, _category) => {
    if (purchased.includes(item.id)) {
      setMessage({ type: 'error', text: t('alreadyOwned') });
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    if (balance < item.cost) {
      setMessage({ type: 'error', text: t('notEnoughGiuros') });
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const result = await spendGiuros(username, item.cost, item.id);
    if (result.success) {
      setBalance(result.newBalance);
      setPurchased(prev => [...prev, item.id]);
      setMessage({ type: 'success', text: `${t('purchased') || 'Purchased'} ${item.name}!` });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: result.error || t('purchaseFailed') || 'Purchase failed' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleEquip = async (item, category) => {
    const newEquipped = { ...equipped };

    if (category === 'frames') {
      newEquipped.frameId = item.id;
    } else if (category === 'titles') {
      newEquipped.titleId = item.id;
    }

    await setEquippedCosmetics(username, newEquipped);
    setEquipped(newEquipped);
    setMessage({ type: 'success', text: `${t('equipped')} ${item.name}!` });
    setTimeout(() => setMessage(null), 2000);
  };

  const tabs = [
    { id: 'frames', label: `🖼️ ${t('frames')}`, items: shopItems.avatarFrames },
    { id: 'titles', label: `🏷️ ${t('titles')}`, items: shopItems.titles },
    { id: 'special', label: `✨ ${t('special')}`, items: shopItems.special },
  ];

  const activeItems = tabs.find(t => t.id === activeTab)?.items || [];

  const isOwned = itemId => purchased.includes(itemId);
  const isEquipped = itemId => {
    if (activeTab === 'frames') return equipped.frameId === itemId;
    if (activeTab === 'titles') return equipped.titleId === itemId;
    return false;
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500
           ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}
      `}
    >
      <TopBar onOpenPage={page => navigate(page ? `/${page}` : '/')} />

      <div className="flex-1 overflow-y-auto w-full px-4 py-6 pt-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity z-10"
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

            {/* Title Centered */}
            <h1 className="text-xl font-black absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <span>🛒</span> {t('shop')}
            </h1>

            {/* Balance - Transparent */}
            <div className="flex items-center gap-2 px-2 z-10">
              <img src="/giuro.png" alt="Giuros" className="h-6 w-auto object-contain" />
              <span className="font-black text-lg text-yellow-600 dark:text-yellow-400">
                {balance}
              </span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-center font-bold text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white shadow-lg'
                    : theme === 'dark'
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
            </div>
          ) : (
            <div
              className={
                activeTab === 'titles'
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
              }
            >
              {activeItems.map(item => {
                const owned = isOwned(item.id);
                const active = isEquipped(item.id);

                // Titles use the same list/card view as Frames now
                // But we add specific behavior (clickable icon for flavor text)

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      active
                        ? 'border-sky-500 bg-sky-500/10'
                        : theme === 'dark'
                          ? 'border-slate-700 bg-slate-800'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Preview Icon - Clickable for Titles to show Flavor Text */}
                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                        <div
                          onClick={() => {
                            if (activeTab === 'titles') setFlavorModal(item);
                          }}
                          className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl relative overflow-hidden shrink-0 ${
                            activeTab === 'titles'
                              ? 'cursor-pointer hover:scale-105 transition-transform'
                              : ''
                          }`}
                        >
                          {item.cssClass ? (
                            <div className={`w-10 h-10 rounded-full ${item.cssClass}`} />
                          ) : (
                            <span>{item.image ? '🎁' : item.prefix || item.emoji || '✨'}</span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-sm leading-tight">
                            {t(item.name) || item.name}
                          </h3>
                          <p className="text-xs opacity-60 mt-1 line-clamp-2">
                            {activeTab === 'titles' && item.flavorText
                              ? `"${item.flavorText}"`
                              : t(item.description) || item.description}
                          </p>
                        </div>
                      </div>

                      {/* Price / Status */}
                      <div className="text-right ml-2 shrink-0">
                        {owned ? (
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                            ✓ {t('owned')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <img src="/giuro.png" alt="" className="h-4 w-auto object-contain" />
                            <span className="font-black text-yellow-600 dark:text-yellow-400 text-sm">
                              {item.cost}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {owned ? (
                        activeTab !== 'special' && (
                          <button
                            onClick={() => handleEquip(item, activeTab)}
                            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                              active
                                ? 'bg-sky-500 text-white'
                                : theme === 'dark'
                                  ? 'bg-slate-700 hover:bg-slate-600'
                                  : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            {active ? `✓ ${t('equipped')}` : t('equip')}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handlePurchase(item, activeTab)}
                          disabled={balance < item.cost}
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                            balance >= item.cost
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {t('buy')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {flavorModal && (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setFlavorModal(null)}
          >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <div
              className={`p-6 rounded-3xl w-full max-w-sm shadow-2xl transform transition-all relative ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-5xl mb-4 shadow-inner">
                  {flavorModal.prefix || flavorModal.emoji || '✨'}
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {t(flavorModal.name) || flavorModal.name}
                </h3>
                <div className="text-sm opacity-60 italic px-4">
                  "
                  {t(flavorModal.flavorText) ||
                    flavorModal.flavorText ||
                    t(flavorModal.description) ||
                    flavorModal.description}
                  "
                </div>
              </div>

              {/* Cost Badge */}
              <div className="flex justify-center mb-6">
                {(() => {
                  const owned = isOwned(flavorModal.id);
                  if (owned)
                    return (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-sm">
                        {t('owned')}
                      </span>
                    );
                  return (
                    <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full">
                      <img src="/giuro.png" alt="" className="w-5 h-5" />
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {flavorModal.cost}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {(() => {
                  const owned = isOwned(flavorModal.id);
                  const active = isEquipped(flavorModal.id);

                  if (owned) {
                    return (
                      <button
                        onClick={() => {
                          handleEquip(flavorModal, 'titles');
                          setFlavorModal(null);
                        }}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                          active
                            ? 'bg-emerald-500 text-white'
                            : 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg'
                        }`}
                      >
                        {active ? `✓ ${t('equipped')}` : t('equip')}
                      </button>
                    );
                  } else {
                    return (
                      <button
                        onClick={() => handlePurchase(flavorModal, 'titles')}
                        disabled={balance < flavorModal.cost}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                          balance >= flavorModal.cost
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {t('buy')}
                      </button>
                    );
                  }
                })()}

                <button
                  onClick={() => setFlavorModal(null)}
                  className="px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

ShopScreen.propTypes = {
  username: PropTypes.string.isRequired,
};

export default ShopScreen;
