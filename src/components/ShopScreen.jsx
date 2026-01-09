import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  getGiuros,
  spendGiuros,
  getPurchasedCosmetics,
  setEquippedCosmetics,
  getEquippedCosmetics,
} from '../utils/giuros';
import cosmetics from '../data/cosmetics.json';
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

  useEffect(() => {
    const loadData = async () => {
      if (!username) return;
      setLoading(true);
      const [bal, owned, eq] = await Promise.all([
        getGiuros(username),
        getPurchasedCosmetics(username),
        getEquippedCosmetics(username),
      ]);
      setBalance(bal);
      setPurchased(owned);
      setEquipped(eq);
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
    { id: 'frames', label: `🖼️ ${t('frames')}`, items: cosmetics.avatarFrames },
    { id: 'titles', label: `🏷️ ${t('titles')}`, items: cosmetics.titles },
    { id: 'special', label: `✨ ${t('special')}`, items: cosmetics.special },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeItems.map(item => {
                const owned = isOwned(item.id);
                const active = isEquipped(item.id);

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
                    {activeTab === 'titles' && item.flavorText && (
                      <button
                        onClick={() => setFlavorModal(item)}
                        className="w-full mb-3 text-xs font-bold text-sky-500 hover:text-sky-600 underline text-left"
                      >
                        {t('readFlavor') || 'Read Inscription'}
                      </button>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="flex-1 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => item.flavorText && setFlavorModal(item)}
                        onKeyDown={e =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          item.flavorText &&
                          setFlavorModal(item)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                          {item.prefix && <span className="text-lg">{item.prefix}</span>}
                          <h3 className="font-bold">{t(item.name) || item.name}</h3>
                        </div>
                        {item.description && (
                          <p className="text-xs opacity-60 mt-1">
                            {t(item.description) || item.description}
                          </p>
                        )}
                        {item.cssClass && (
                          <div className="mt-2">
                            <div
                              className={`w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 ${item.cssClass}`}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Price / Status */}
                      <div className="text-right">
                        {owned ? (
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/20 px-2 py-1 rounded-full">
                            ✓ {t('owned')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <img src="/giuro.png" alt="" className="h-4 w-auto object-contain" />
                            <span className="font-black text-yellow-600 dark:text-yellow-400">
                              {item.cost}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {owned ? (
                        activeTab !== 'special' && (
                          <button
                            onClick={() => handleEquip(item, activeTab)}
                            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
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
                          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
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

      {flavorModal && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setFlavorModal(null)}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            className={`p-6 rounded-2xl max-w-sm w-full shadow-2xl transform scale-100 transition-all ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                {flavorModal.image ? (
                  <img
                    src={flavorModal.image}
                    alt="Flavor"
                    className="h-16 w-16 mx-auto object-contain"
                  />
                ) : (
                  '🎖️'
                )}
              </div>
              <h3 className="text-xl font-black mb-2">{flavorModal.name}</h3>
              <p className="opacity-80 italic mb-6">"{flavorModal.flavorText}"</p>
              <button
                onClick={() => setFlavorModal(null)}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors"
              >
                {t('close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ShopScreen.propTypes = {
  username: PropTypes.string.isRequired,
};

export default ShopScreen;
