# Codebase Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce file complexity and separate concerns across 6 hot-spot files without changing any behavior.

**Architecture:** Pure code-movement refactors — no logic changes, no API changes. Each task extracts code into a new file and updates imports. All existing consumers continue to work via barrel exports or direct re-imports.

**Tech Stack:** React 19, TypeScript, Vite — run `npm run type-check` and `npm test -- --run` to verify after each task.

---

## Pre-flight

Before starting any task, confirm the baseline is green:

```bash
cd /Users/robertosanchezgallego/Desktop/Girify
npm run type-check
npm test -- --run
```

Both must pass. Fix any pre-existing failures before proceeding.

---

## Task 1: Extract `useFriends` reducer

**Problem:** `useFriends.ts` (336 lines) inlines its reducer, all action types, initial state, and two local type declarations alongside the hook logic. The reducer alone is 45 lines.

**Files:**

- Create: `src/features/friends/hooks/friendsReducer.ts`
- Modify: `src/features/friends/hooks/useFriends.ts`

---

- [ ] **Step 1: Create `friendsReducer.ts`**

Extract the types, reducer, and initial state out of `useFriends.ts` into a new file. Copy exactly — do not change any logic.

```ts
// src/features/friends/hooks/friendsReducer.ts
import type { FriendRequest, UserSearchResult } from '../../../utils/social/friends';

export interface Friend {
  username: string;
  avatarId?: number;
  badges?: string[];
  todayGames?: number;
  equippedCosmetics?: {
    avatarId?: string;
    frameId?: string;
    titleId?: string;
  };
}

export interface FeedItem {
  id: string;
  type: string;
  username: string;
  oldUsername?: string;
  badge?: { name: string; emoji: string };
  itemName?: string;
  score?: number;
  timestamp?: { seconds: number };
  avatarId?: number;
}

export interface FriendsState {
  friends: Friend[];
  requests: FriendRequest[];
  feed: FeedItem[];
  searchResults: UserSearchResult[];
  searching: boolean;
  loading: boolean;
  successfulRequests: Set<string>;
  error: string | null;
  feedOffset: number;
  hasMoreFeed: boolean;
  acceptingRequest: string | null;
  decliningRequest: string | null;
}

export type FriendsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FRIENDS'; payload: Friend[] }
  | { type: 'SET_REQUESTS'; payload: FriendRequest[] }
  | { type: 'SET_FEED'; payload: FeedItem[] }
  | { type: 'APPEND_FEED'; payload: FeedItem[] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_SEARCH_RESULTS'; payload: UserSearchResult[] }
  | { type: 'ADD_SUCCESSFUL_REQUEST'; payload: string }
  | { type: 'REMOVE_SUCCESSFUL_REQUEST'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACCEPTING_REQUEST'; payload: string | null }
  | { type: 'SET_DECLINING_REQUEST'; payload: string | null };

export const initialState: FriendsState = {
  friends: [],
  requests: [],
  feed: [],
  searchResults: [],
  searching: false,
  loading: false,
  successfulRequests: new Set(),
  error: null,
  feedOffset: 0,
  hasMoreFeed: true,
  acceptingRequest: null,
  decliningRequest: null,
};

export function friendsReducer(state: FriendsState, action: FriendsAction): FriendsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FRIENDS':
      return { ...state, friends: action.payload };
    case 'SET_REQUESTS':
      return { ...state, requests: action.payload };
    case 'SET_FEED':
      return {
        ...state,
        feed: action.payload,
        feedOffset: action.payload.length,
        hasMoreFeed: action.payload.length >= 20,
      };
    case 'APPEND_FEED':
      return {
        ...state,
        feed: [...state.feed, ...action.payload],
        feedOffset: state.feedOffset + action.payload.length,
        hasMoreFeed: action.payload.length > 0,
      };
    case 'SET_SEARCHING':
      return { ...state, searching: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'ADD_SUCCESSFUL_REQUEST':
      return {
        ...state,
        successfulRequests: new Set(state.successfulRequests).add(action.payload),
      };
    case 'REMOVE_SUCCESSFUL_REQUEST': {
      const newSet = new Set(state.successfulRequests);
      newSet.delete(action.payload);
      return { ...state, successfulRequests: newSet };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACCEPTING_REQUEST':
      return { ...state, acceptingRequest: action.payload };
    case 'SET_DECLINING_REQUEST':
      return { ...state, decliningRequest: action.payload };
    default:
      return state;
  }
}
```

- [ ] **Step 2: Update `useFriends.ts` to import from new file**

Replace the inline declarations at the top of `useFriends.ts`. Remove: the `Friend`, `FeedItem`, `FriendsState`, `FriendsAction`, `initialState`, `friendsReducer` declarations. Add imports instead:

```ts
// Replace the local declarations block with:
import {
  type FeedItem,
  type Friend,
  type FriendsState,
  friendsReducer,
  initialState,
} from './friendsReducer';
```

The `export interface Friend` and `export interface FeedItem` in `useFriends.ts` are re-exported from that file — after the move, re-export them from `friendsReducer.ts` instead:

```ts
// At top of useFriends.ts, add these re-exports so consumers still work:
export type { FeedItem, Friend } from './friendsReducer';
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/friends/hooks/friendsReducer.ts src/features/friends/hooks/useFriends.ts
git commit -m "refactor(friends): extract useFriends reducer to friendsReducer.ts"
```

---

## Task 2: Extract `useAuth` sync helpers

**Problem:** `useAuth.ts` (350 lines) contains 4 standalone async helper functions (`syncUserProfile`, `syncLocalHistory`, `syncLocalCosmetics`, `backfillJoinDate`) and 1 linkage helper (`linkSupabaseUid`) that are all defined below the hook export. The hook itself is ~180 lines; the helpers are ~170 lines. They can live in a separate module.

**Files:**

- Create: `src/features/auth/hooks/authSyncHelpers.ts`
- Modify: `src/features/auth/hooks/useAuth.ts`

---

- [ ] **Step 1: Create `authSyncHelpers.ts`**

Copy the 5 standalone functions verbatim — do not change any logic. They need these imports (pull from the `useAuth.ts` import block):

```ts
// src/features/auth/hooks/authSyncHelpers.ts
import { STORAGE_KEYS, TIME } from '../../../config/constants';
import { FeedbackReward, GameHistory, UserProfile } from '../../../types/user';
import { logger } from '../../../utils/logger';
import {
  checkUnseenFeedbackRewards,
  ensureUserProfile,
  getUserGameHistory,
  getUserProfile,
  healMigration,
  markFeedbackRewardSeen,
  updateUserProfile,
} from '../../../utils/social';
import { storage } from '../../../utils/storage';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';

// Copy linkSupabaseUid, syncUserProfile, syncLocalHistory,
// syncLocalCosmetics, backfillJoinDate verbatim from useAuth.ts
```

Export all 5 functions.

- [ ] **Step 2: Update `useAuth.ts`**

Remove the 5 helper function definitions from `useAuth.ts`. Add import at the top:

```ts
import { linkSupabaseUid, syncUserProfile } from './authSyncHelpers';
```

(`syncLocalHistory`, `syncLocalCosmetics`, `backfillJoinDate` are called only from `syncUserProfile` inside `authSyncHelpers.ts`, so they don't need to be re-imported in `useAuth.ts`.)

Clean up any now-unused imports in `useAuth.ts` (e.g. `FeedbackReward`, `GameHistory`, `getUserGameHistory`, `checkUnseenFeedbackRewards`, `markFeedbackRewardSeen`, `ensureUserProfile`, `healMigration`, `TIME`, `storage`).

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

The `useAuth.test.ts` file mocks several imports. Verify it still imports correctly from the same paths. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/hooks/authSyncHelpers.ts src/features/auth/hooks/useAuth.ts
git commit -m "refactor(auth): extract sync helpers out of useAuth into authSyncHelpers.ts"
```

---

## Task 3: Fix shop mid-file import + extract `checkUnlockCondition`

**Problem:** `utils/shop/index.ts` has two issues:

1. `import { UserProfile } from '../../types/user'` appears at line 304 — mid-file, after function definitions. This violates standard import ordering and causes ESLint warnings.
2. `checkUnlockCondition` is a pure utility function (no side effects, no caching) that doesn't belong in the same file as the shop item fetching/caching machinery.

**Files:**

- Create: `src/utils/shop/types.ts`
- Create: `src/utils/shop/unlock.ts`
- Modify: `src/utils/shop/index.ts`

**Important:** `unlock.ts` must NOT import from `./index` — that creates a circular dependency (`index.ts` re-exports `unlock.ts` which imports `index.ts`). Instead, move the `ShopItem` type to a shared `types.ts` file.

---

- [ ] **Step 1: Create `types.ts`**

Move the `ShopItem`, `ShopItemType`, and `GroupedShopItems` interfaces out of `index.ts` into a new file:

```ts
// src/utils/shop/types.ts
export type ShopItemType = 'frame' | 'title' | 'special' | 'avatar' | 'avatars';

export interface ShopItem {
  id: string;
  name?: string;
  type: ShopItemType;
  cost?: number;
  price?: number;
  rarity?: string;
  color?: string;
  description?: string;
  image?: string;
  emoji?: string;
  cssClass?: string;
  flavorText?: string;
  prefix?: string;
  unlockCondition?: { type: string; value: number };
  [key: string]: unknown;
}

export interface GroupedShopItems {
  avatarFrames: ShopItem[];
  frames: ShopItem[];
  titles: ShopItem[];
  special: ShopItem[];
  avatars: ShopItem[];
  all: ShopItem[];
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
```

- [ ] **Step 2: Update `index.ts` to import types from `./types`**

Remove the `ShopItemType`, `ShopItem`, `GroupedShopItems`, `OperationResult` declarations from `index.ts`. Add at the top:

```ts
import type { GroupedShopItems, OperationResult, ShopItem, ShopItemType } from './types';
export type { GroupedShopItems, OperationResult, ShopItem, ShopItemType } from './types';
```

This re-exports the types for any consumer that currently imports them from `utils/shop`.

- [ ] **Step 3: Create `unlock.ts`**

```ts
// src/utils/shop/unlock.ts
import type { UserProfile } from '../../types/user';
import type { ShopItem } from './types';

/**
 * Check if a shop item is locked for the user
 */
export const checkUnlockCondition = (
  item: ShopItem,
  userStats: Partial<UserProfile> | null
): { locked: boolean; reason?: string } => {
  if (!item.unlockCondition || !userStats) {
    return { locked: false };
  }

  const { type, value } = item.unlockCondition;

  if (type === 'streak') {
    const currentStreak = userStats.streak || 0;
    if (currentStreak < value) {
      return { locked: true, reason: `Need ${value} day streak (Current: ${currentStreak})` };
    }
  }

  if (type === 'gamesPlayed') {
    const games = userStats.gamesPlayed || 0;
    if (games < value) {
      return { locked: true, reason: `Play ${value} games (Current: ${games})` };
    }
  }

  if (type === 'bestScore') {
    const best = userStats.bestScore || 0;
    if (best < value) {
      return { locked: true, reason: `Score > ${value} in one game (Best: ${best})` };
    }
  }

  return { locked: false };
};
```

- [ ] **Step 4: Finish updating `utils/shop/index.ts`**

- Remove the mid-file `import { UserProfile } from '../../types/user'` (line 304).
- Remove the `checkUnlockCondition` function definition.
- Add with the other top-level imports: `export { checkUnlockCondition } from './unlock';`

This re-export ensures all existing consumers of `checkUnlockCondition` from `utils/shop` continue to work without any changes.

- [ ] **Step 5: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

- [ ] **Step 6: Run tests**

```bash
npm test -- --run
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/utils/shop/types.ts src/utils/shop/unlock.ts src/utils/shop/index.ts
git commit -m "refactor(shop): extract types and checkUnlockCondition, fix mid-file import"
```

---

## Task 4: Extract admin functions from `utils/social/profile.ts`

**Problem:** `profile.ts` mixes two distinct concerns:

- **User-facing profile CRUD** (`rowToProfile`, `ensureUserProfile`, `getUserProfile`, `getUserByEmail`, `getUserByUid`, `updateUserProfile`, `migrateUser`, `healMigration`)
- **Admin-only operations** (`getAllUsers`, `updateUserAsAdmin`, `deleteUserAndData`) — these require admin privileges, are called only from admin panel code, and import `requireAdmin` dynamically

**Files:**

- Create: `src/utils/social/profileAdmin.ts`
- Modify: `src/utils/social/profile.ts`
- Modify: `src/utils/social/index.ts`

---

- [ ] **Step 1: Create `profileAdmin.ts`**

Copy the three admin functions verbatim:

```ts
// src/utils/social/profileAdmin.ts
import { supabase } from '../../services/supabase';
import { updateUser } from '../../services/database';
import type { UserProfile } from './types';
import { normalizeUsername } from '../format';
import { rowToProfile } from './profile';

/**
 * Get all users for admin table
 */
export const getAllUsers = async (limitCount = 50): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(limitCount);
    if (error || !data) return [];
    return data.map(rowToProfile);
  } catch (e) {
    console.error('Error fetching all users:', e);
    return [];
  }
};

/**
 * Update user data as Admin
 */
export const updateUserAsAdmin = async (
  targetUsername: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!targetUsername || !data) return;

  const { requireAdmin } = await import('../auth');
  await requireAdmin();

  const dbData: Record<string, unknown> = {};
  if (data.realName !== undefined) dbData.real_name = data.realName;
  if (data.avatarId !== undefined) dbData.avatar_id = data.avatarId;
  if (data.giuros !== undefined) dbData.giuros = data.giuros;
  if (data.banned !== undefined) dbData.banned = data.banned;
  if (data.streak !== undefined) dbData.streak = data.streak;
  if (data.district !== undefined) dbData.district = data.district;
  if (data.team !== undefined) dbData.team = data.team;

  await updateUser(targetUsername, dbData);
};

/**
 * Delete a user and all their associated data
 */
export const deleteUserAndData = async (
  username: string
): Promise<{ success: boolean; error?: string }> => {
  if (!username) return { success: false, error: 'No username provided' };

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', normalizeUsername(username));

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    console.error('Error deleting user:', e);
    return { success: false, error: (e as Error).message };
  }
};
```

- [ ] **Step 2: Remove admin functions from `profile.ts`**

Delete `getAllUsers`, `updateUserAsAdmin`, and `deleteUserAndData` from `profile.ts`.

Also remove any imports in `profile.ts` that are now only needed by those removed functions (none are exclusive to them, so likely no import cleanup needed — double-check).

- [ ] **Step 3: Update `utils/social/index.ts`**

Change the export source for the three admin functions from `'./profile'` to `'./profileAdmin'`:

```ts
// Change this:
export {
  deleteUserAndData,
  // ...
  getAllUsers,
  // ...
  updateUserAsAdmin,
  // ...
} from './profile';

// To (split into two export blocks):
export {
  ensureUserProfile,
  getUserByEmail,
  getUserByUid,
  getUserProfile,
  healMigration,
  migrateUser,
  rowToProfile,
  updateUserProfile,
} from './profile';

export { deleteUserAndData, getAllUsers, updateUserAsAdmin } from './profileAdmin';
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: 0 errors. Consumers like `useAdminData.ts` and `AdminTeams.tsx` import via `utils/social` barrel — they won't need changes.

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/social/profileAdmin.ts src/utils/social/profile.ts src/utils/social/index.ts
git commit -m "refactor(profile): extract admin-only operations to profileAdmin.ts"
```

---

## Task 5: Extract `MapArea` inner components to separate files

**Problem:** `MapArea.tsx` (382 lines) defines three inner React components (`ChangeView`, `ZoomHandler`, `RecenterControl`) and a large constants block inline. The constants alone are ~50 lines. Moving sub-components to their own files makes each unit independently readable and testable.

**Files:**

- Create: `src/features/game/components/map/mapConstants.ts`
- Create: `src/features/game/components/map/ChangeView.tsx`
- Create: `src/features/game/components/map/ZoomHandler.tsx`
- Create: `src/features/game/components/map/RecenterControl.tsx`
- Modify: `src/features/game/components/MapArea.tsx`

---

- [ ] **Step 1: Create `map/mapConstants.ts`**

Move all constants from `MapArea.tsx` (lines 20–52) verbatim:

```ts
// src/features/game/components/map/mapConstants.ts
import L from 'leaflet';

export const MAP_PADDING: [number, number] = [80, 80];
export const MAP_PADDING_MOBILE: [number, number] = [40, 40];
export const ANIMATION_DURATION = 2.0;
export const ANIMATION_TIMEOUT = 2100;
export const INITIAL_WAIT = 100;
export const CENTER_LAT = 41.3879;
export const CENTER_LNG = 2.1699;
export const INITIAL_ZOOM = 13;
export const MIN_ZOOM = 11;
export const MAX_ZOOM_ANIMATION = 15;
export const MAX_ZOOM_RECENTER = 18;
export const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [41.2, 2.0],
  [41.6, 2.45],
];
export const BOUNDS_VISCOSITY = 0.5;
export const MOBILE_BREAKPOINT = 768;

export const ICON_SIZE: [number, number] = [30, 30];
export const ICON_ANCHOR: [number, number] = [15, 15];
export const TOOLTIP_OFFSET: [number, number] = [0, 5];
export const TOOLTIP_OPACITY = 0.9;

export const WEIGHT_THIN = 8;
export const WEIGHT_NORMAL = 10;
export const WEIGHT_THICK = 12;
export const WEIGHT_EXTRA_THICK = 16;
export const WEIGHT_HIGHLIGHT = 4;
export const OPACITY_LOW = 0.5;
export const OPACITY_HIGH = 1.0;
export const OPACITY_HIGHLIGHT = 0.8;

export const RECENTER_BUTTON_STYLE = { bottom: '20px', left: '20px', zIndex: 1000 };
```

- [ ] **Step 2: Create `map/ChangeView.tsx`**

```tsx
// src/features/game/components/map/ChangeView.tsx
import React, { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import {
  ANIMATION_DURATION,
  ANIMATION_TIMEOUT,
  INITIAL_WAIT,
  MAP_PADDING,
  MAX_ZOOM_ANIMATION,
} from './mapConstants';

interface ChangeViewProps {
  coords: number[][][] | null;
  onAnimationComplete?: () => void;
}

const ChangeView: React.FC<ChangeViewProps> = ({ coords, onAnimationComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const allPoints = coords.flat() as L.LatLngExpression[];
      if (allPoints.length === 0) return;

      let animationTimer: NodeJS.Timeout;

      const flyToStreet = () => {
        map.invalidateSize();
        try {
          map.flyToBounds(allPoints as L.LatLngBoundsExpression, {
            padding: MAP_PADDING,
            maxZoom: MAX_ZOOM_ANIMATION,
            duration: ANIMATION_DURATION,
            animate: true,
          });
          if (onAnimationComplete) {
            animationTimer = setTimeout(() => {
              onAnimationComplete();
            }, ANIMATION_TIMEOUT);
          }
        } catch (err) {
          console.warn('Map flyToBounds failed', err);
          if (onAnimationComplete) onAnimationComplete();
        }
      };

      const startTimer = setTimeout(flyToStreet, INITIAL_WAIT);
      return () => {
        clearTimeout(startTimer);
        if (animationTimer) clearTimeout(animationTimer);
      };
    }
    return () => {};
  }, [coords, map, onAnimationComplete]);
  return null;
};

export default ChangeView;
```

- [ ] **Step 3: Create `map/ZoomHandler.tsx`**

```tsx
// src/features/game/components/map/ZoomHandler.tsx
import React from 'react';
import { useMapEvents } from 'react-leaflet';

interface ZoomHandlerProps {
  setCurrentZoom: (zoom: number) => void;
}

const ZoomHandler: React.FC<ZoomHandlerProps> = ({ setCurrentZoom }) => {
  const map = useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });
  return null;
};

export default ZoomHandler;
```

- [ ] **Step 4: Create `map/RecenterControl.tsx`**

```tsx
// src/features/game/components/map/RecenterControl.tsx
import React from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import {
  MAP_PADDING,
  MAP_PADDING_MOBILE,
  MAX_ZOOM_RECENTER,
  MOBILE_BREAKPOINT,
  RECENTER_BUTTON_STYLE,
  INITIAL_ZOOM,
} from './mapConstants';

interface RecenterControlProps {
  center: [number, number];
  zoom: number;
  bounds: number[][][] | null;
}

const RecenterControl: React.FC<RecenterControlProps> = ({ center, zoom, bounds }) => {
  const map = useMap();

  const handleRecenter = () => {
    if (bounds && bounds.length > 0) {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const padding: [number, number] = isMobile ? MAP_PADDING_MOBILE : MAP_PADDING;
      const allPoints = bounds.flat() as L.LatLngExpression[];
      map.fitBounds(allPoints as unknown as L.LatLngBoundsExpression, {
        padding,
        maxZoom: MAX_ZOOM_RECENTER,
      });
    } else if (center) {
      map.setView(center, zoom || INITIAL_ZOOM);
    }
  };

  return (
    <div className="leaflet-bottom leaflet-left !pointer-events-auto" style={RECENTER_BUTTON_STYLE}>
      <button
        onClick={handleRecenter}
        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-lg shadow-lg hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700 font-inter"
        title="Re-center Map"
        aria-label="Re-center Map"
        type="button"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>
    </div>
  );
};

export default RecenterControl;
```

- [ ] **Step 5: Update `MapArea.tsx`**

Remove all the constant declarations and the three inner component definitions. Replace with imports from the `map/` subdirectory:

```tsx
import ChangeView from './map/ChangeView';
import ZoomHandler from './map/ZoomHandler';
import RecenterControl from './map/RecenterControl';
import {
  BOUNDS_VISCOSITY,
  CENTER_LAT,
  CENTER_LNG,
  INITIAL_ZOOM,
  MAX_BOUNDS,
  MIN_ZOOM,
  OPACITY_HIGH,
  OPACITY_LOW,
  OPACITY_HIGHLIGHT,
  WEIGHT_EXTRA_THICK,
  WEIGHT_HIGHLIGHT,
  WEIGHT_NORMAL,
  WEIGHT_THIN,
  WEIGHT_THICK,
  ICON_ANCHOR,
  ICON_SIZE,
  TOOLTIP_OFFSET,
  TOOLTIP_OPACITY,
  MAX_ZOOM_ANIMATION,
} from './map/mapConstants';
```

The `createEmojiIcon` helper and `LANDMARK_ICONS` pre-computation remain in `MapArea.tsx` as they depend on `L` and local imports.

- [ ] **Step 6: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

- [ ] **Step 7: Run tests**

```bash
npm test -- --run
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/game/components/map/ src/features/game/components/MapArea.tsx
git commit -m "refactor(map): extract MapArea sub-components and constants to map/ subdirectory"
```

---

## Task 6: Extract `LeaderboardScreen` row components

**Problem:** `LeaderboardScreen.tsx` (370 lines) has a `renderContent()` function that inlines ~85 lines of individual score row JSX and ~60 lines of team score row JSX. Extracting these as named sub-components makes `renderContent()` a clean list-renderer, improves readability, and enables future independent styling or testing.

**Files:**

- Create: `src/features/leaderboard/components/IndividualScoreRow.tsx`
- Create: `src/features/leaderboard/components/TeamScoreRow.tsx`
- Modify: `src/features/leaderboard/components/LeaderboardScreen.tsx`

---

- [ ] **Step 1: Create `IndividualScoreRow.tsx`**

Extract the per-score `<motion.div>` block from `renderContent()`:

```tsx
// src/features/leaderboard/components/IndividualScoreRow.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { UI } from '../../../utils/constants';
import { formatUsername, usernamesMatch } from '../../../utils/format';
import { ScoreEntry } from '../../../utils/social/leaderboard';
import { themeClasses } from '../../../utils/themeUtils';

interface IndividualScoreRowProps {
  entry: ScoreEntry;
  index: number;
  currentUser?: string;
}

const IndividualScoreRow: React.FC<IndividualScoreRowProps> = ({
  entry: s,
  index,
  currentUser,
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  let dateStr = 'Unknown';
  try {
    const ts = s.timestamp;
    if (ts && typeof ts === 'object' && 'seconds' in ts) {
      dateStr = new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } else if (typeof ts === 'number' || typeof ts === 'string') {
      dateStr = new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  } catch {
    dateStr = '--';
  }

  const isMe = currentUser && usernamesMatch(s.username, currentUser);

  const handleClick = () => {
    if (usernamesMatch(s.username, currentUser)) {
      navigate('/profile');
    } else {
      navigate(`/user/${encodeURIComponent(s.username)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * UI.ANIMATION.DURATION_FAST }}
      key={s.id || index}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]
        ${isMe ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10' : themeClasses(theme, 'bg-slate-800 border-slate-700 hover:border-slate-600', 'bg-white border-slate-200 hover:border-sky-200 shadow-sm')}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm relative overflow-hidden
            ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 opacity-50'}
          `}
        >
          {index + 1}
        </div>
        <div>
          <div className="font-bold text-sm flex items-center gap-2 font-inter">
            {formatUsername(s.username)}
            {isMe && (
              <span className="text-[10px] bg-sky-500 text-white px-1.5 rounded-full font-inter">
                YOU
              </span>
            )}
          </div>
          <div className="text-[10px] opacity-50 font-mono">{dateStr}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-black text-lg text-sky-500 font-inter">{s.score.toLocaleString()}</div>
        <div className="text-[9px] font-bold opacity-40 uppercase font-inter">Points</div>
      </div>
    </motion.div>
  );
};

export default IndividualScoreRow;
```

- [ ] **Step 2: Create `TeamScoreRow.tsx`**

```tsx
// src/features/leaderboard/components/TeamScoreRow.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { DISTRICTS } from '../../../data/districts';
import { UI } from '../../../utils/constants';
import { TeamScoreEntry } from '../../../utils/social/leaderboard';
import { themeClasses } from '../../../utils/themeUtils';

interface TeamScoreRowProps {
  team: TeamScoreEntry;
  index: number;
}

const TeamScoreRow: React.FC<TeamScoreRowProps> = ({ team, index }) => {
  const { theme } = useTheme();
  const district = DISTRICTS.find(d => d.teamName === team.teamName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * UI.ANIMATION.DURATION_FAST }}
      key={team.id}
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all
        ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200 shadow-sm')}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-sm relative overflow-hidden
            ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : index === 2 ? 'bg-amber-600' : 'bg-slate-100 dark:bg-slate-700'}
          `}
        >
          {district?.logo ? (
            <img src={district.logo} alt={team.teamName} className="w-full h-full object-cover" />
          ) : (
            index + 1
          )}
        </div>
        <div>
          <div className="font-bold text-sm flex items-center gap-2 font-inter">
            {team.teamName}
          </div>
          <div className="text-[10px] opacity-50 font-mono flex items-center gap-2">
            <span>
              {team.memberCount} {team.memberCount === 1 ? 'player' : 'players'}
            </span>
            <span>•</span>
            <span>avg {team.avgScore.toLocaleString()} pts</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-black text-lg text-emerald-500 font-inter">
          {team.score.toLocaleString()}
        </div>
        <div className="text-[9px] font-bold opacity-40 uppercase font-inter">Total Points</div>
      </div>
    </motion.div>
  );
};

export default TeamScoreRow;
```

- [ ] **Step 3: Update `LeaderboardScreen.tsx`**

- Add imports for the two new components.
- Replace the inline `<motion.div>` blocks in `renderContent()` with `<IndividualScoreRow>` and `<TeamScoreRow>`.
- Remove the now-unused imports: `motion` (if no longer used directly), `DISTRICTS` (moved to TeamScoreRow), `formatUsername`, `usernamesMatch`, and `themeClasses` — if `LeaderboardScreen` no longer uses them directly.

The `renderContent()` teams section becomes:

```tsx
return (
  <div className="space-y-2 pb-10">
    {teamScores.map((team, index) => (
      <TeamScoreRow key={team.id} team={team} index={index} />
    ))}
  </div>
);
```

The individual section becomes:

```tsx
return (
  <div className="space-y-2 pb-10">
    {scores.map((s, index) => (
      <IndividualScoreRow key={s.id || index} entry={s} index={index} currentUser={currentUser} />
    ))}
  </div>
);
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/leaderboard/components/IndividualScoreRow.tsx src/features/leaderboard/components/TeamScoreRow.tsx src/features/leaderboard/components/LeaderboardScreen.tsx
git commit -m "refactor(leaderboard): extract IndividualScoreRow and TeamScoreRow components"
```

---

## Post-flight

After all tasks are committed:

```bash
npm run lint
npm run type-check
npm test -- --run
npm run build
```

All must pass clean. Address any warnings surfaced by the lint pass.

---

## Summary of Changes

| Task | Files Created                                                                     | Files Modified                  | Lines Moved |
| ---- | --------------------------------------------------------------------------------- | ------------------------------- | ----------- |
| 1    | `friendsReducer.ts`                                                               | `useFriends.ts`                 | ~120        |
| 2    | `authSyncHelpers.ts`                                                              | `useAuth.ts`                    | ~170        |
| 3    | `types.ts`, `unlock.ts`                                                           | `shop/index.ts`                 | ~70         |
| 4    | `profileAdmin.ts`                                                                 | `profile.ts`, `social/index.ts` | ~75         |
| 5    | `map/mapConstants.ts`, `ChangeView.tsx`, `ZoomHandler.tsx`, `RecenterControl.tsx` | `MapArea.tsx`                   | ~160        |
| 6    | `IndividualScoreRow.tsx`, `TeamScoreRow.tsx`                                      | `LeaderboardScreen.tsx`         | ~145        |

**Total: 9 new files, 7 modified files. Zero behavior changes.**
