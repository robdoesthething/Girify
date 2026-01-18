import { Timestamp } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import {
  Achievement,
  getNextAchievement,
  getUnlockedAchievements,
} from '../../../data/achievements';
import { AVATARS } from '../../../data/avatars';
import EditProfileModal from './EditProfileModal';
// import cosmeticsData from '../../../data/cosmetics.json';
import TopBar from '../../../components/TopBar';
import { GameHistory, UserProfile } from '../../../types/user';
import { formatUsername } from '../../../utils/format';
import { getFriendCount } from '../../../utils/friends';
import { getEquippedCosmetics, getGiuros } from '../../../utils/giuros';
import { getShopItems, ShopItem } from '../../../utils/shop';
import { getUserGameHistory, getUserProfile, updateUserProfile } from '../../../utils/social';
import { calculateStreak } from '../../../utils/stats';

const HISTORY_LIMIT = 7;
const SCORE_DIVISOR = 1000;
const ROUND_FACTOR = 100;

// interface Cosmetics {
//   avatars: { id: string; image: string }[];
//   avatarFrames: { id: string; cssClass: string }[];
//   titles: { id: string; name: string }[];
// }
// const cosmetics = cosmeticsData as Cosmetics;

// Helper function for date parsing
const parseJoinedDate = (joinedAt: any): Date => {
  if (!joinedAt) {
    return new Date();
  }
  if (joinedAt instanceof Timestamp) {
    return joinedAt.toDate();
  }
  if ('seconds' in joinedAt) {
    return new Date(joinedAt.seconds * 1000);
  }
  return new Date(joinedAt as string);
};

// Helper for badge class
const getBadgeClass = (isSelected: boolean, theme: string): string => {
  if (isSelected) {
    return 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 scale-105 shadow-md';
  }
  return theme === 'dark'
    ? 'bg-slate-800 border-transparent hover:bg-slate-700'
    : 'bg-white border-transparent shadow-sm hover:shadow-md';
};

// Helper for recent activity class
const getActivityClasses = (isDaily: boolean, theme: string) => {
  if (isDaily) {
    return {
      container:
        theme === 'dark'
          ? 'bg-emerald-900/10 border-emerald-500/20'
          : 'bg-emerald-50 border-emerald-100',
      score: 'text-emerald-600 dark:text-emerald-400 scale-110 inline-block font-inter',
    };
  }
  return {
    container: theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100',
    score: 'text-slate-400 font-medium font-inter',
  };
};

interface ProfileHeaderProps {
  username: string;
  profileData: UserProfile;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  joinedDate: string;
  equippedCosmetics: Record<string, string>;
  navigate: (path: string) => void;
  theme: string;
  t: (key: string) => string;
  allAvatars: ShopItem[];
  allFrames: ShopItem[];
  allTitles: ShopItem[];
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  profileData,
  isEditing,
  setIsEditing,
  joinedDate,
  equippedCosmetics,
  navigate,
  theme,
  t,
  allAvatars,
  allFrames,
  allTitles,
}) => {
  const equippedAvatarId = equippedCosmetics?.avatarId;
  const cosmeticAvatar = allAvatars.find(a => a.id === equippedAvatarId);
  const legacyAvatarIndex = profileData?.avatarId ? profileData.avatarId - 1 : 0;
  const legacyAvatar = AVATARS[Math.max(0, Math.min(legacyAvatarIndex, AVATARS.length - 1))];
  const equippedFrame = allFrames.find(f => f.id === equippedCosmetics.frameId);
  const frameClass = equippedFrame?.cssClass || 'ring-4 ring-white dark:ring-slate-700';
  const titleName =
    allTitles.find(tItem => tItem.id === equippedCosmetics.titleId)?.name || 'Street Explorer';

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/shop')}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate('/shop');
            }
          }}
          className={`w-28 h-28 rounded-full ${cosmeticAvatar ? 'bg-transparent' : 'bg-gradient-to-br from-sky-400 to-indigo-600'} flex items-center justify-center text-5xl shadow-2xl ${frameClass} select-none outline-none focus:ring-sky-500 cursor-pointer hover:scale-105 transition-transform overflow-hidden`}
        >
          {cosmeticAvatar ? (
            <img
              src={cosmeticAvatar.image as string}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            legacyAvatar
          )}
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={`absolute -bottom-1 -right-1 p-2 rounded-full shadow-lg ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'}`}
            type="button"
            aria-label={t('editProfile') || 'Edit Profile'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        )}
      </div>

      <h2 className="text-3xl font-black tracking-tight mb-1">{formatUsername(username)}</h2>

      <div className="flex flex-col items-center gap-1">
        {/* Modal handled at screen level, just showing name here */}
        <p className="text-sm font-medium opacity-60 mb-2">
          {profileData.realName || t('unknownName') || 'Unknown Player'}
        </p>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-3 font-mono">
        {t('playerSince')} {joinedDate}
      </p>

      <div className="text-center mb-6 mt-4">
        <p className="text-sm font-bold text-sky-500 uppercase tracking-widest mt-1 font-inter">
          {titleName}
        </p>
        <p className="text-xs opacity-50 mt-1">Joined {joinedDate}</p>
      </div>
    </div>
  );
};

interface StatsGridProps {
  dailyStreak: number;
  maxStreak: number;
  friendCount: number;
  totalGames: number;
  bestScore: number;
  totalScore: number;
  t: (key: string) => string;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  dailyStreak,
  maxStreak,
  friendCount,
  totalGames,
  bestScore,
  totalScore,
  t,
}) => {
  return (
    <div className="grid grid-cols-5 gap-4 mb-8">
      <div className="flex flex-col items-center p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/5">
        <span className="text-2xl mb-1">🔥</span>
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-black text-orange-500">{dailyStreak}</span>
          <span className="text-[10px] font-bold opacity-50 font-mono">
            Max: {Math.max(dailyStreak, maxStreak)}
          </span>
        </div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('streak')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5">
        <span className="text-2xl mb-1">👥</span>
        <span className="text-xl font-black text-purple-500">{friendCount}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('friends')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-500/10 dark:bg-slate-500/5">
        <span className="text-2xl mb-1">🎮</span>
        <span className="text-xl font-black text-slate-700 dark:text-slate-200">{totalGames}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('games')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5">
        <span className="text-2xl mb-1">🏆</span>
        <span className="text-xl font-black text-emerald-500">{bestScore}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          {t('best')}
        </span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-2xl bg-sky-500/10 dark:bg-sky-500/5">
        <span className="text-2xl mb-1">⚡️</span>
        <span className="text-xl font-black text-sky-500">
          {totalScore >= SCORE_DIVISOR ? `${(totalScore / SCORE_DIVISOR).toFixed(1)}k` : totalScore}
        </span>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1 font-inter">
          Total
        </span>
      </div>
    </div>
  );
};

interface AchievementsListProps {
  unlockedBadges: Achievement[];
  selectedAchievement: Achievement | null;
  setSelectedAchievement: (a: Achievement | null) => void;
  nextBadge: Achievement | null;
  theme: string;
  t: (key: string) => string;
}

const AchievementsList: React.FC<AchievementsListProps> = ({
  unlockedBadges,
  selectedAchievement,
  setSelectedAchievement,
  nextBadge,
  theme,
  t,
}) => {
  return (
    <div className="mb-8">
      <h3 className="font-bold text-lg mb-4 text-sky-500 flex items-center gap-2 font-inter">
        {t('achievements')}{' '}
        <span className="text-sm opacity-60 text-slate-500 dark:text-slate-400">
          ({unlockedBadges.length})
        </span>
      </h3>

      {unlockedBadges.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {unlockedBadges.map(badge => (
            <div
              key={badge.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedAchievement(selectedAchievement?.id === badge.id ? null : badge)
              }
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedAchievement(selectedAchievement?.id === badge.id ? null : badge);
                }
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer border w-full h-full text-left ${getBadgeClass(
                selectedAchievement?.id === badge.id,
                theme
              )}`}
              title={badge.description}
            >
              {badge.image ? (
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-10 h-10 object-contain mb-1 drop-shadow-sm"
                />
              ) : (
                <span className="text-3xl mb-1">{badge.emoji}</span>
              )}
              <span className="text-[10px] text-center font-bold opacity-70 leading-tight">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-50 text-center py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-inter">
          Play games to unlock achievements!
        </p>
      )}

      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {selectedAchievement.image ? (
                <img
                  src={selectedAchievement.image}
                  alt={selectedAchievement.name}
                  className="w-16 h-16 object-contain drop-shadow-md"
                />
              ) : (
                <span className="text-4xl">{selectedAchievement.emoji}</span>
              )}
              <div>
                <h4 className="font-bold text-sky-600 dark:text-sky-400 font-inter">
                  {selectedAchievement.name}
                </h4>
                <p className="text-sm opacity-80 font-inter">{selectedAchievement.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {nextBadge && (
        <div
          className={`mt-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold opacity-60 font-inter">{t('nextAchievement')}</span>
            {nextBadge.image ? (
              <img src={nextBadge.image} alt={nextBadge.name} className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-lg">{nextBadge.emoji}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex-1 h-3 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}
            >
              <div
                className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all shadow-sm"
                style={{ width: `${Math.round((nextBadge.progress ?? 0) * ROUND_FACTOR)}%` }}
              />
            </div>
            <span className="text-xs font-bold opacity-60 w-8 text-right font-mono">
              {Math.round((nextBadge.progress ?? 0) * ROUND_FACTOR)}%
            </span>
          </div>
          <p className="text-xs opacity-50 mt-2 font-inter">
            {nextBadge.name}: {nextBadge.description}
          </p>
        </div>
      )}
    </div>
  );
};

interface RecentActivityProps {
  allHistory: GameHistory[];
  theme: string;
  t: (key: string) => string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ allHistory, theme, t }) => {
  // Sort and calculate daily earliest
  const { sortedHistory, dailyEarliest } = useMemo(() => {
    const sorted = [...allHistory].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      if (timeA && timeB) {
        return timeB - timeA;
      }
      // Fallback
      return 0;
    });

    const earliest = new Map<string, number>();
    sorted.forEach(g => {
      if (g.timestamp) {
        if (!earliest.has(g.date) || g.timestamp < (earliest.get(g.date) as number)) {
          earliest.set(g.date, g.timestamp);
        }
      }
    });
    return { sortedHistory: sorted, dailyEarliest: earliest };
  }, [allHistory]);

  return (
    <div className="mb-20">
      <h3 className="font-bold text-lg mb-4 text-sky-500 font-inter">{t('recentActivity')}</h3>
      {allHistory.length === 0 ? (
        <div className="text-center py-10 opacity-40 text-sm font-inter">{t('noGamesYet')}</div>
      ) : (
        <div className="space-y-3">
          {sortedHistory.slice(0, HISTORY_LIMIT).map(game => {
            const isDaily = game.timestamp && dailyEarliest.get(game.date) === game.timestamp;

            const classes = getActivityClasses(!!isDaily, theme);

            return (
              <div
                key={`${game.date}-${game.timestamp}`}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${classes.container}`}
              >
                <div>
                  <p className="font-bold text-sm font-inter">{t('dailyChallenge')}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {game.timestamp ? new Date(game.timestamp).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-black text-lg ${classes.score}`}>{game.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1 font-inter">PTS</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Hook for fetching profile data
const useProfileData = (username: string) => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [allHistory, setAllHistory] = useState<GameHistory[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [giuros, setGiuros] = useState(0);
  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string>>({});
  const [joinedDate, setJoinedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [shopAvatars, setShopAvatars] = useState<ShopItem[]>([]);
  const [shopFrames, setShopFrames] = useState<ShopItem[]>([]);
  const [shopTitles, setShopTitles] = useState<ShopItem[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        return;
      }

      try {
        setLoading(true);
        const [count, bal, equipped, history, profile, shopItems] = await Promise.all([
          getFriendCount(username),
          getGiuros(username),
          getEquippedCosmetics(username),
          getUserGameHistory(username),
          getUserProfile(username),
          getShopItems(),
        ]);

        setFriendCount(count);
        setGiuros(bal);
        setEquippedCosmetics(equipped || {});

        // Map GameData to GameHistory
        const mappedHistory: GameHistory[] = (history || []).map(h => {
          let ts = 0;
          if (h.timestamp && typeof (h.timestamp as any).toDate === 'function') {
            ts = (h.timestamp as any).toDate().getTime();
          } else if ((h.timestamp as any)?.seconds) {
            ts = (h.timestamp as any).seconds * 1000;
          } else if (typeof h.timestamp === 'number') {
            ts = h.timestamp;
          } else {
            // Fallback to date number if timestamp missing
            const dStr = h.date?.toString() || '';
            if (dStr.length === 8) {
              const y = parseInt(dStr.slice(0, 4), 10);
              const m = parseInt(dStr.slice(4, 6), 10) - 1;
              const d = parseInt(dStr.slice(6, 8), 10);
              ts = new Date(y, m, d).getTime();
            }
          }

          return {
            date: h.date?.toString() || new Date(ts).toISOString().slice(0, 10),
            score: h.score,
            avgTime: '0s', // Default as it's missing in GameData
            timestamp: ts,
            username: username,
          };
        });

        setAllHistory(mappedHistory);
        setShopAvatars(shopItems.avatars || []);
        setShopFrames(shopItems.avatarFrames || []);
        setShopTitles(shopItems.titles || []);

        if (profile) {
          const userProfile = profile as UserProfile;
          setProfileData(userProfile);
          setJoinedDate(parseJoinedDate(userProfile.joinedAt).toLocaleDateString());
        } else {
          // Default joined date
          setJoinedDate(localStorage.getItem('girify_joined') || new Date().toLocaleDateString());
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  return {
    profileData,
    setProfileData,
    allHistory,
    friendCount,
    giuros,
    equippedCosmetics,
    joinedDate,
    loading,
    shopAvatars,
    shopFrames,
    shopTitles,
  };
};

interface ProfileScreenProps {
  username: string;
}

// eslint-disable-next-line max-lines-per-function
const ProfileScreen: React.FC<ProfileScreenProps> = ({ username }) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const {
    profileData,
    setProfileData,
    allHistory,
    friendCount,
    giuros,
    equippedCosmetics,
    joinedDate,
    loading,
    shopAvatars,
    shopFrames,
    shopTitles,
  } = useProfileData(username);

  const [isEditing, setIsEditing] = useState(false);
  const [showGiurosInfo, setShowGiurosInfo] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // useEffect for initial edit name population removed as logic moved to modal

  const uniqueHistory = useMemo(() => {
    const seenDates = new Set();
    const uniqueList: GameHistory[] = [];
    allHistory.forEach(game => {
      if (!seenDates.has(game.date)) {
        seenDates.add(game.date);
        uniqueList.push(game);
      }
    });
    return uniqueList;
  }, [allHistory]);

  const streakHistory = useMemo(() => {
    return uniqueHistory.map(h => ({
      date: parseInt(h.date.replace(/-/g, ''), 10),
    }));
  }, [uniqueHistory]);

  // Determine owned items
  const ownedAvatars = useMemo(() => {
    // Basic logic: Default avatars + Purchased ones + Unlocked ones
    // For now, assuming all "purchasedCosmetics" in profileData contains IDs
    const ownedIds = new Set(profileData?.purchasedCosmetics || []);
    // Always include free avatars (cost 0)
    shopAvatars.forEach(a => {
      if (a.cost === 0) {
        ownedIds.add(a.id);
      }
    });
    return shopAvatars.filter(a => ownedIds.has(a.id));
  }, [profileData, shopAvatars]);

  const ownedFrames = useMemo(() => {
    const ownedIds = new Set(profileData?.purchasedCosmetics || []);
    // Always include free frames if any (usually none, but future proof)
    shopFrames.forEach(f => {
      if (f.cost === 0) {
        ownedIds.add(f.id);
      }
    });
    return shopFrames.filter(f => ownedIds.has(f.id));
  }, [profileData, shopFrames]);

  const handleSaveProfile = async (newName: string, newAvatarId: string, newFrameId: string) => {
    const updates: Partial<UserProfile> = {
      realName: newName,
      // Update equippedCosmetics in profile
      equippedCosmetics: {
        ...equippedCosmetics,
        avatarId: newAvatarId,
        frameId: newFrameId,
      },
    };

    // Also update legacy avatarId for backward compat if it's a legacy avatar
    // (This is best effort, ideally we move away from integer IDs)

    await updateUserProfile(username, updates as any);

    // Update local state
    setProfileData(prev => (prev ? { ...prev, ...updates } : null));

    // Force update of equipped cosmetics state
    // In a real app keying by user ID or refetching might be cleaner
    window.location.reload();

    setIsEditing(false);
  };

  const totalGames = allHistory.length > 0 ? allHistory.length : profileData?.gamesPlayed || 0;
  const calculatedBest =
    allHistory.length > 0 ? Math.max(...allHistory.map(h => (h && h.score) || 0)) : 0;
  const bestScore = Math.max(calculatedBest, profileData?.bestScore || 0);
  const totalScore =
    allHistory.length > 0
      ? allHistory.reduce((acc, curr) => acc + ((curr && curr.score) || 0), 0)
      : profileData?.totalScore || 0;

  const dailyStreak =
    allHistory.length > 0 ? calculateStreak(streakHistory) : profileData?.streak || 0;

  const userStats = { gamesPlayed: totalGames, bestScore, streak: dailyStreak };
  const unlockedBadges = getUnlockedAchievements(userStats);
  const nextBadge = getNextAchievement(userStats);

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      <TopBar
        onOpenPage={page => navigate(page ? `/${page}` : '/')}
        onTriggerLogin={mode => navigate(`/?auth=${mode}`)}
      />

      <div className="flex-1 w-full px-4 py-8 pt-20 overflow-x-hidden">
        <div className="max-w-2xl mx-auto w-full">
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
            <h1 className="text-xl font-black absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 max-w-[60%] truncate justify-center font-inter">
              {t('profile') || 'Profile'}
            </h1>

            <button
              onClick={() => setShowGiurosInfo(!showGiurosInfo)}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
              type="button"
              aria-label={`${giuros} Giuros`}
            >
              <img src="/giuro.png" alt="Giuros" className="h-6 w-auto object-contain" />
              <span className="font-black text-lg text-yellow-600 dark:text-yellow-400">
                {giuros}
              </span>
            </button>
          </div>

          {loading && <div className="py-10 text-center opacity-50">Loading profile...</div>}

          {profileData && !loading && (
            <>
              <AnimatePresence>
                {showGiurosInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="relative mb-8 mx-2 filter drop-shadow-md overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white relative z-10">
                      <div className="flex items-start gap-3">
                        <img
                          src="/giuro.png"
                          alt=""
                          className="h-8 w-auto object-contain shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <h3 className="font-black text-lg mb-1">{t('giurosExplainerTitle')}</h3>
                          <p className="text-sm opacity-80 mb-3 leading-relaxed font-inter">
                            {t('giurosExplainerText')}
                          </p>
                          <button
                            onClick={() => navigate('/shop')}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform"
                            type="button"
                          >
                            {t('goToShop')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ProfileHeader
                username={username}
                profileData={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                // editName and setEditName removed as they are handled in modal
                joinedDate={joinedDate}
                equippedCosmetics={equippedCosmetics}
                // onSave removed as it's handled in modal
                navigate={p => navigate(p)}
                theme={theme}
                t={t}
                allAvatars={shopAvatars}
                allFrames={shopFrames}
                allTitles={shopTitles}
              />

              <EditProfileModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleSaveProfile}
                currentName={profileData.realName || ''}
                currentAvatarId={equippedCosmetics.avatarId || ''}
                currentFrameId={equippedCosmetics.frameId || ''}
                ownedAvatars={ownedAvatars}
                ownedFrames={ownedFrames}
                allAvatars={shopAvatars}
              />

              <StatsGrid
                dailyStreak={dailyStreak}
                maxStreak={profileData.maxStreak || 0}
                friendCount={friendCount}
                totalGames={totalGames}
                bestScore={bestScore}
                totalScore={totalScore}
                t={t}
              />

              <AchievementsList
                unlockedBadges={unlockedBadges}
                selectedAchievement={selectedAchievement}
                setSelectedAchievement={setSelectedAchievement}
                nextBadge={nextBadge}
                theme={theme}
                t={t}
              />

              <RecentActivity allHistory={allHistory} theme={theme} t={t} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
