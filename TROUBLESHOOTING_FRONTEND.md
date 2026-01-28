# Frontend Troubleshooting Guide

## ✅ Backend Status: WORKING

All backend diagnostics passed:

- ✅ Supabase connection
- ✅ RLS policies fixed
- ✅ Game saves working (21 games in database)
- ✅ Friendship RPC functions working
- ✅ Friend requests working

**If you're still experiencing issues, they're frontend/client-side.**

---

## 🔧 How to Debug in Browser

### Step 1: Open Browser Console

1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click on "Console" tab
3. Look for errors in red

### Step 2: Run Frontend Debug Script

Copy and paste the **entire** content of `/public/debug-frontend.js` into the console and press Enter.

**Or manually check:**

```javascript
// 1. Check if logged in
import('/src/firebase.ts').then(({ auth }) => {
  const user = auth.currentUser;
  console.log('Logged in:', !!user);
  console.log('Display Name:', user?.displayName);
  console.log('Email:', user?.email);
});

// 2. Check game history
const history = localStorage.getItem('girify_game_history');
console.log('Local games:', history ? JSON.parse(history).length : 0);

// 3. Check Supabase connection
import('/src/services/supabase.ts').then(async ({ supabase }) => {
  const { data, error } = await supabase.from('game_results').select('*').limit(1);
  console.log('Can read from Supabase:', !error);
  console.log('Error:', error);
});
```

### Step 3: Check Network Tab

1. Go to `F12 → Network` tab
2. Filter by "Fetch/XHR"
3. Play a game or try to accept a friend request
4. Look for:
   - Red/orange failed requests
   - `game_results` POST requests
   - `friend_requests` or `friendships` requests

---

## 🐛 Common Issues & Fixes

### Issue 1: Games Not Saving

**Symptoms:**

- Game ends but doesn't appear in profile
- Leaderboard doesn't update

**Root Causes:**

#### A. No Firebase displayName set

**Check:**

```javascript
import('/src/firebase.ts').then(({ auth }) => {
  console.log('Display Name:', auth.currentUser?.displayName);
});
```

**If it shows `null` or `undefined`:**

```javascript
// Fix: Set your display name
import('/src/firebase.ts').then(async ({ auth }) => {
  await auth.currentUser.updateProfile({
    displayName: '@yourusername', // Use your actual username
  });
  console.log('Display name updated!');
  // Reload the page
  window.location.reload();
});
```

**Then:** Check Supabase users table - make sure your username exists there.

#### B. Username doesn't exist in users table

**Error in console:** `"violates foreign key constraint"`

**Fix:** Your Firebase user needs a corresponding entry in Supabase `users` table.

**Check:**

```javascript
import('/src/services/supabase.ts').then(async ({ supabase }) => {
  const { data } = await supabase.from('users').select('*').eq('username', '@yourusername'); // Your username
  console.log('User exists:', !!data?.[0]);
});
```

**If no user found**, create one (should happen automatically on first login, but can be done manually):

```javascript
import('/src/services/supabase.ts').then(async ({ supabase }) => {
  const { auth } = await import('/src/firebase.ts');
  const user = auth.currentUser;

  await supabase.from('users').insert({
    uid: user.uid,
    username: user.displayName, // Must match displayName
    email: user.email,
    created_at: new Date().toISOString(),
  });

  console.log('User created!');
});
```

#### C. Username format mismatch

**Issue:** Saved as `@username` but querying as `username` (or vice versa)

**Check console logs for:**

- `[Fallback] Saving game for username: ...`
- `[DB] getUserGameHistory - Querying for username: ...`

**Fix:** Ensure consistent format. All usernames should be normalized (lowercase, with or without @).

### Issue 2: Friendships Not Working

**Symptoms:**

- Can't see friends list
- Friend requests not appearing
- Can't accept friend requests

**Root Causes:**

#### A. Not logged in or no username

**Check:**

```javascript
import('/src/firebase.ts').then(({ auth }) => {
  const user = auth.currentUser;
  console.log('Logged in:', !!user);
  console.log('Has username:', !!user?.displayName);
});
```

**Fix:** Log in first, ensure displayName is set (see Issue 1A above).

#### B. RPC functions not called

**Check Network tab:**

- Look for calls to `/rest/v1/rpc/get_friends`
- Look for calls to `/rest/v1/rpc/add_friendship`

**If missing:** Friends page isn't loading data correctly.

**Check console for:**

```
[DB:Friends] Error fetching...
```

#### C. Friend request stuck in pending

**Check database:**

```javascript
import('/src/services/supabase.ts').then(async ({ supabase }) => {
  const { data } = await supabase.from('friend_requests').select('*').eq('status', 'pending');
  console.log('Pending requests:', data);
});
```

**To manually accept:**

```javascript
import('/src/services/db/friends.ts').then(async module => {
  const result = await module.addFriendship('user1', 'user2');
  console.log('Friendship added:', result);

  // Update request status
  await module.updateFriendRequestStatus('user1', 'user2', 'accepted');
  console.log('Request updated!');
});
```

### Issue 3: Browser Cache Issues

**Symptoms:**

- Old data showing
- Changes not reflected
- Intermittent behavior

**Fix:**

1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Clear cache: `Ctrl+Shift+Delete`
3. Or in Console:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📝 Key Console Messages to Look For

### Good Signs ✅

```
[Save Success] Game saved: game-xyz
[Persistence] Save Success (GameID: ...)
[DB] getUserGameHistory - Found X games for username
✅ Successfully promoted user...
```

### Warning Signs ⚠️

```
[Fallback] No username in state, cannot save to Supabase
[Migration] No gameId found - using fallback save
[DB] Error fetching...
```

### Error Signs ❌

```
[Save Error] Failed to save game: ...
[DB] insertGameResult error: ...
violates row-level security policy
violates foreign key constraint
```

---

## 🧪 Testing Game Save Manually

In browser console:

```javascript
// Test game save
import('/src/services/db/games.ts').then(async ({ insertGameResult }) => {
  const { auth } = await import('/src/firebase.ts');
  const user = auth.currentUser;

  if (!user || !user.displayName) {
    console.error('Not logged in or no displayName!');
    return;
  }

  const result = await insertGameResult({
    user_id: user.displayName,
    score: 888, // Test score
    time_taken: 30,
    correct_answers: 8,
    question_count: 10,
    played_at: new Date().toISOString(),
    platform: 'web',
    is_bonus: false,
  });

  console.log('Test save result:', result);

  if (result.success) {
    console.log('✅ Game saves are working!');

    // Clean up test data
    const { supabase } = await import('/src/services/supabase.ts');
    await supabase.from('game_results').delete().eq('score', 888).eq('user_id', user.displayName);
    console.log('Test data cleaned up');
  } else {
    console.error('❌ Game save failed:', result.error);
  }
});
```

---

## 📊 Full Diagnostic Checklist

Run through this checklist:

- [ ] Backend diagnostics pass: `npx tsx scripts/diagnose-supabase.ts`
- [ ] Logged in to Firebase: Check console
- [ ] Firebase displayName set: Check `auth.currentUser.displayName`
- [ ] User exists in Supabase users table
- [ ] Username format consistent (with/without @)
- [ ] No console errors when playing game
- [ ] Network requests succeeding (no red/orange in Network tab)
- [ ] Browser cache cleared
- [ ] Tried in incognito/private mode
- [ ] Checked both desktop and mobile views

---

## 🆘 Still Not Working?

1. **Capture full error:**
   - Open Console
   - Clear it (trash icon)
   - Reproduce the issue (play game or accept friend request)
   - Screenshot ALL console output

2. **Capture network failure:**
   - Open Network tab
   - Filter by Fetch/XHR
   - Reproduce the issue
   - Find the failed request (red/orange)
   - Click on it → Preview/Response tab
   - Screenshot the error

3. **Check specific data:**

   ```javascript
   // Your username
   import('/src/firebase.ts').then(({ auth }) => {
     console.log('My username:', auth.currentUser?.displayName);
   });

   // Your recent games
   import('/src/services/supabase.ts').then(async ({ supabase }) => {
     const { auth } = await import('/src/firebase.ts');
     const { data } = await supabase
       .from('game_results')
       .select('*')
       .eq('user_id', auth.currentUser?.displayName)
       .order('played_at', { ascending: false })
       .limit(5);
     console.log('My recent games:', data);
   });

   // Your friendships
   import('/src/services/db/friends.ts').then(async ({ getFriends }) => {
     const { auth } = await import('/src/firebase.ts');
     const friends = await getFriends(auth.currentUser?.displayName || '');
     console.log('My friends:', friends);
   });
   ```

4. **Share:**
   - Console screenshots
   - Network screenshots
   - Your username
   - Specific error messages

---

## 💡 Prevention

To avoid future issues:

1. **Always ensure displayName is set** when users sign up
2. **Create Supabase user entry** on first login
3. **Normalize usernames** consistently (lowercase, with/without @)
4. **Monitor console** for errors during development
5. **Test in incognito mode** to catch cache issues

---

**Last Updated:** January 28, 2026
