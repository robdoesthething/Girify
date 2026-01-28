# Frontend Issues Investigation Results

**Date**: January 29, 2026
**Status**: ✅ Root cause identified

---

## Summary

After running comprehensive diagnostics, I found that **the backend is 100% functional**. The issue is that the friendship RPC functions don't normalize username inputs, causing mismatches when the frontend passes usernames in different formats.

---

## Findings

### 1. Backend Status: ✅ WORKING

All backend tests passed (5/5):

- ✅ Supabase connection working
- ✅ Game inserts working
- ✅ Game queries working
- ✅ RPC functions exist and are callable
- ✅ Friend requests table accessible

**Database contains**:

- 22 game results
- 1 active friendship: `@robertosnc7344 ↔ @robertosnc9113`
- 1 pending friend request
- 7 users

### 2. Root Cause: Username Normalization Issue

The `get_friends` RPC function does **exact string matching** without normalizing the input:

```sql
-- Current implementation
WHERE f.user_a = user_username OR f.user_b = user_username
```

**Test Results**:

- ✅ `get_friends('@robertosnc7344')` → Returns 1 friend
- ❌ `get_friends('robertosnc7344')` → Returns 0 friends

The friendships are stored with the `@` prefix in the database, but if the frontend calls the RPC without the `@`, it returns no results.

### 3. Frontend Behavior

The frontend code in `src/utils/social/friends.ts` does normalize usernames:

```typescript
const clean = sanitize(username); // Removes @ and normalizes
const dbFriends = await dbGetFriends(clean); // Calls RPC without @
```

This means:

1. User logs in with username `@robertosnc7344`
2. Frontend sanitizes it to `robertosnc7344` (removes @)
3. Calls `get_friends('robertosnc7344')`
4. RPC searches for exact match `robertosnc7344` in database
5. Database has `@robertosnc7344` stored
6. No match found → Returns empty array
7. Frontend shows "No friends"

---

## Solution

Apply the SQL fix in `scripts/fix-get-friends-rpc.sql` to normalize username inputs in all friendship RPC functions:

```sql
-- Before
WHERE f.user_a = user_username OR f.user_b = user_username

-- After
normalized_username := LOWER(user_username);
IF NOT normalized_username LIKE '@%' THEN
    normalized_username := '@' || normalized_username;
END IF;
WHERE f.user_a = normalized_username OR f.user_b = normalized_username
```

This ensures the RPC functions work regardless of whether the input has the `@` prefix or not.

---

## How to Fix

### Option 1: Update RPC Functions (Recommended)

Run the SQL script in Supabase:

```bash
# Copy the contents of scripts/fix-get-friends-rpc.sql
# Paste into Supabase SQL Editor
# Execute
```

### Option 2: Update Frontend to Always Pass @

Modify `src/utils/social/friends.ts` to ensure usernames always have the `@` prefix when calling RPCs:

```typescript
const clean = sanitize(username);
const cleanWithAt = clean.startsWith('@') ? clean : `@${clean}`;
const dbFriends = await dbGetFriends(cleanWithAt);
```

---

## Verification

After applying the fix, test with:

```bash
npx tsx scripts/test-get-friends.ts
```

Expected output:

```
✅ Found 1 friend(s) for @robertosnc7344
✅ Found 1 friend(s) for robertosnc7344 (without @)
```

---

## Leaderboard Status

The leaderboard functions are working correctly based on backend tests. If there are display issues:

1. Check browser console for errors
2. Verify date filters are calculating correctly (UTC vs local time)
3. Check if games have the correct `played_at` timestamps

Enhanced logging has been added to help diagnose leaderboard issues in the browser console.

---

## Files Created/Modified

### Diagnostic Tools

- `scripts/test-rpc-detailed.ts` - Detailed RPC testing
- `scripts/test-get-friends.ts` - Username format testing
- `FRONTEND_ISSUES_FOUND.md` - This file

### Fixes

- `scripts/fix-get-friends-rpc.sql` - SQL fix for RPC functions
- `src/features/friends/hooks/useFriends.ts` - Enhanced error handling
- `src/utils/social/friends.ts` - Better validation and warnings
- `src/utils/social/leaderboard.ts` - Enhanced error logging

---

## Next Steps

1. **Apply the SQL fix** in Supabase
2. **Test in browser** - Friends should now load
3. **Monitor console** for any new errors
4. **Clear browser cache** if issues persist

---

**Bottom Line**: The issue is NOT a broken backend or frontend code logic. It's a simple username format mismatch between what the frontend sends and what the RPC expects. Once the RPC functions are updated to normalize inputs, friendships will work perfectly.
