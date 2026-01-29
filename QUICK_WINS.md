# Quick Wins - Immediate Improvements

These improvements can be implemented today for maximum impact with minimal effort.

---

## 🚀 30-Minute Wins

### 1. Add Database Indexes (30 min)

**Impact**: 2-5x faster queries
**Effort**: Copy-paste SQL

```sql
-- Run in Supabase SQL Editor
CREATE INDEX IF NOT EXISTS idx_activity_feed_username_created_at
ON activity_feed(username, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_status
ON friend_requests(to_user, status)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_game_results_user_played
ON game_results(user_id, played_at DESC);

CREATE INDEX IF NOT EXISTS idx_friendships_composite
ON friendships(user_a, user_b);
```

**Test**: Run slow queries before/after, measure improvement

---

## ⚡ 1-Hour Wins

### 2. Fix Friends Tab Loading (1 hour)

**Impact**: 66% fewer API calls
**File**: `src/features/friends/components/FriendsScreen.tsx`

**Before** (loads everything on every tab change):

```typescript
useEffect(() => {
  loadFriends();
  loadRequests();
  loadFeed();
}, [activeTab]);
```

**After** (loads only active tab):

```typescript
useEffect(() => {
  if (activeTab === 'friends') loadFriends();
  if (activeTab === 'requests') loadRequests();
  if (activeTab === 'feed') loadFeed();
}, [activeTab]);

// Initial load
useEffect(() => {
  loadFriends();
}, []);
```

**Test**: Open dev tools network tab, switch tabs, verify only 1 request per tab

---

### 3. Add Activity Feed Auth Check (1 hour)

**Impact**: Prevents impersonation attacks
**File**: `src/utils/social/publishActivity.ts`

**Add before publishing**:

```typescript
import { auth } from '../firebase';
import { getUserByUsername } from './social/profile';

export const publishActivity = async (
  username: string,
  type: string,
  data: Record<string, unknown> = {}
): Promise<void> => {
  if (!username || !type) return;

  // NEW: Verify user owns this username
  const currentUser = await getUserByUsername(username);
  const firebaseUid = auth.currentUser?.uid;

  if (!currentUser || currentUser.uid !== firebaseUid) {
    console.error('[Activity] Auth failed: user does not own username');
    return;
  }

  // Existing code...
  try {
    const row = mapToRow(username, type, data);
    await dbPublishActivity(row);
  } catch (e) {
    console.error('[Activity] Error publishing activity:', e);
  }
};
```

**Test**: Try to publish activity for another user's username, should fail

---

## 🎯 2-Hour Wins

### 4. Profile Lazy Loading (2 hours)

**Impact**: 50% faster perceived load
**File**: `src/features/profile/hooks/useProfileData.ts`

**Split critical from non-critical data**:

```typescript
const loadProfile = useCallback(async () => {
  if (!normalizedUsername) return;

  try {
    setLoading(true);

    // CRITICAL: Load immediately (shows profile fast)
    const [profile, bal, equipped] = await Promise.all([
      getUserProfile(normalizedUsername),
      getGiuros(normalizedUsername),
      getEquippedCosmetics(normalizedUsername),
    ]);

    setProfileData(profile);
    setGiuros(bal);
    setEquippedCosmetics(equipped);
    setJoinedDate(parseJoinedDate(profile.joinedAt).toLocaleDateString());
    setLoading(false); // ← User sees profile here (faster!)

    // NON-CRITICAL: Load in background
    Promise.all([
      getFriendCount(normalizedUsername),
      getUserGameHistory(normalizedUsername),
      getShopItems(),
    ]).then(([count, history, shopItems]) => {
      setFriendCount(count);
      setAllHistory(history);
      setShopAvatars(shopItems.avatars);
      setShopFrames(shopItems.avatarFrames);
      setShopTitles(shopItems.titles);
    });
  } catch (e) {
    console.error('[Profile] Error loading profile:', e);
    setLoading(false);
  }
}, [normalizedUsername]);
```

**Test**: Profile should appear visible within 300-400ms instead of 1-2s

---

### 5. Add Loading States (2 hours)

**Impact**: Better UX, prevents double-clicks
**Files**:

- `src/features/friends/hooks/useFriends.ts`
- `src/features/shop/hooks/usePurchase.ts`

**Pattern**:

```typescript
// Add state
const [isAccepting, setIsAccepting] = useState<string | null>(null);

// Wrap async action
const acceptRequest = useCallback(async (requester: string) => {
  setIsAccepting(requester); // ← Start loading
  const res = await acceptFriendRequest(username, requester);
  setIsAccepting(null); // ← End loading

  if (res.success) {
    loadRequests();
    loadFriends();
    loadFeed();
  }
  return res;
}, [username]);

// In component
<button
  disabled={isAccepting === request.from_user}
  onClick={() => acceptRequest(request.from_user)}
>
  {isAccepting === request.from_user ? (
    <>
      <Spinner className="w-4 h-4 mr-2" />
      Accepting...
    </>
  ) : (
    'Accept'
  )}
</button>
```

**Apply to**:

- Friend request accept/decline
- Shop purchases
- Profile edits

**Test**: Click buttons rapidly, should not trigger multiple actions

---

## 📊 Impact Summary

| Improvement       | Time    | Performance Gain      | User Impact |
| ----------------- | ------- | --------------------- | ----------- |
| Database indexes  | 30 min  | 2-5x faster queries   | High        |
| Friends tab fix   | 1 hour  | 66% fewer requests    | High        |
| Auth check        | 1 hour  | Security fix          | Critical    |
| Profile lazy load | 2 hours | 50% faster visible    | High        |
| Loading states    | 2 hours | Better perceived perf | Medium      |

**Total Time**: 6.5 hours
**Total Impact**: Massive performance boost + critical security fix

---

## Testing Checklist

After implementing, verify:

- [ ] Database queries are faster (check Supabase logs)
- [ ] Friends screen only loads active tab data
- [ ] Cannot publish activity for other users
- [ ] Profile appears within 500ms
- [ ] Buttons show loading states and prevent double-clicks
- [ ] No regressions in existing functionality

---

## Next Steps

After completing quick wins, see `IMPROVEMENT_OPPORTUNITIES.md` for:

- Medium priority improvements (testing, code quality)
- Low priority improvements (technical debt)
- Full implementation roadmap

**Recommendation**: Do these quick wins first, then tackle high-priority items from main doc.
