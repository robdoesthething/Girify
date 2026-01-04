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
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [activeTab, setActiveTab] = useState('frames');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

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
      setMessage({ type: 'error', text: 'Already owned!' });
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    if (balance < item.cost) {
      setMessage({ type: 'error', text: 'Not enough giuros!' });
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const result = await spendGiuros(username, item.cost, item.id);
    if (result.success) {
      setBalance(result.newBalance);
      setPurchased(prev => [...prev, item.id]);
      setMessage({ type: 'success', text: `Purchased ${item.name}!` });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Purchase failed' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleEquip = async (item, category) => {
    const newEquipped = { ...equipped };

    if (category === 'frames') {
      newEquipped.frameId = item.id;
    } else if (category === 'badges') {
      const currentBadges = newEquipped.badgeIds || [];
      if (currentBadges.includes(item.id)) {
        newEquipped.badgeIds = currentBadges.filter(b => b !== item.id);
      } else if (currentBadges.length < 3) {
        newEquipped.badgeIds = [...currentBadges, item.id];
      } else {
        setMessage({ type: 'error', text: 'Max 3 badges!' });
        setTimeout(() => setMessage(null), 2000);
        return;
      }
    } else if (category === 'titles') {
      newEquipped.titleId = item.id;
    }

    await setEquippedCosmetics(username, newEquipped);
    setEquipped(newEquipped);
    setMessage({ type: 'success', text: `Equipped ${item.name}!` });
    setTimeout(() => setMessage(null), 2000);
  };

  const tabs = [
    { id: 'frames', label: '🖼️ Frames', items: cosmetics.avatarFrames },
    { id: 'badges', label: '🏅 Badges', items: cosmetics.badges },
    { id: 'titles', label: '🏷️ Titles', items: cosmetics.titles },
    { id: 'special', label: '✨ Special', items: cosmetics.special },
  ];

  const activeItems = tabs.find(t => t.id === activeTab)?.items || [];

  const isOwned = itemId => purchased.includes(itemId);
  const isEquipped = itemId => {
    if (activeTab === 'frames') return equipped.frameId === itemId;
    if (activeTab === 'badges') return (equipped.badgeIds || []).includes(itemId);
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
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            {/* Balance */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <img src="/giuro.png" alt="Giuros" className="w-6 h-6" />
              <span className="font-black text-yellow-600 dark:text-yellow-400">{balance}</span>
            </div>
          </div>

          <h1 className="text-3xl font-black mb-6">🛒 Shop</h1>

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
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                          {item.prefix && <span className="text-lg">{item.prefix}</span>}
                          <h3 className="font-bold">{item.name}</h3>
                        </div>
                        {item.description && (
                          <p className="text-xs opacity-60 mt-1">{item.description}</p>
                        )}
                        {item.cssClass && (
                          <div className="mt-2">
                            <div
                              className={`w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 ${item.cssClass}`}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Price / Status */}
                      <div className="text-right">
                        {owned ? (
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/20 px-2 py-1 rounded-full">
                            ✓ Owned
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <img src="/giuro.png" alt="" className="w-4 h-4" />
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
                            {active ? '✓ Equipped' : 'Equip'}
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
                          Buy
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
    </div>
  );
};

ShopScreen.propTypes = {
  username: PropTypes.string.isRequired,
};

export default ShopScreen;
