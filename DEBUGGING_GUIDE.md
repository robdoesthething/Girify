# Debugging Guide: Activity Feed & Profile Issues

This guide helps you diagnose and fix empty activity feeds and profile history issues.

## Quick Diagnosis

### Step 1: Run Database Health Check

Open your browser's developer console (F12) and run:

```javascript
checkDatabaseHealth('your_username');
```

This will check:

- ✅ User profile exists
- ✅ Game results are being saved
- ✅ Activity feed entries exist
- ✅ Friends list is populated
- ✅ Friends' activities are visible
- ✅ RLS policies are configured correctly

### Step 2: Interpret Results

#### All Checks Pass ✅

Your database is healthy! If you still don't see activity:

1. Refresh the page
2. Clear browser cache
3. Check browser console for errors

#### Warnings ⚠️

**"No game results found"**

- **Solution**: Play a complete game. Activity will appear after you finish.

**"No activity feed entries found"**

- **Cause**: This is the main issue - games weren't publishing to activity_feed
- **Solution**: After the fix (commit XXXXX), new games will publish activities
- **Note**: Old games won't appear in feed (only in personal history)

**"No friends found"**

- **Solution**: Add friends at `/friends` to populate your friends feed

**"No activity from friends"**

- **Cause**: Your friends need to play games after the fix
- **Solution**: Wait for friends to play, or ask them to play a game

#### Failures ❌

**"Error fetching..."** or **"Permission denied"**

- **Cause**: Database RLS policies are not configured correctly
- **Solution**: Run the fix script:

```sql
-- In Supabase SQL Editor, run:
-- scripts/fix-supabase-permissions.sql
```

---

## Advanced Testing

### Test Activity Publishing

Manually test if activity publishing works:

```javascript
// Publish a test activity
testPublishDailyScore('your_username', 1000);

// Check permissions
checkActivityPermissions();

// Clean up test data (optional)
clearTestActivities('your_username');
```

### Check Console Logs

After playing a game, check console for these messages:

✅ **Success**:

```
[Activity] Published game completion for username
[DB] getActivityFeed: Retrieved X activities
[Profile] Loaded history: X games
```

❌ **Failure**:

```
[DB] getActivityFeed error: permission denied
[Activity] Failed to publish game activity
```

---

## Common Issues & Solutions

### Issue 1: Empty Profile Activity

**Symptoms**:

- Profile shows "No games yet"
- But you've played games before

**Diagnosis**:

```javascript
checkDatabaseHealth('your_username');
```

**Solutions**:

1. **No game results found** → Play a new game
2. **Permission error** → Run `scripts/fix-supabase-permissions.sql`
3. **Username mismatch** → Check console for normalized username

### Issue 2: Empty Friends Feed

**Symptoms**:

- Friends tab shows "No recent activity from friends"
- But friends have played games

**Diagnosis**:

```javascript
checkDatabaseHealth('your_username');
```

**Solutions**:

1. **No friends** → Add friends first
2. **No friend activities** → Friends need to play games after the fix
3. **Permission error** → Run `scripts/fix-supabase-permissions.sql`

### Issue 3: Activities Not Publishing

**Symptoms**:

- Games save successfully
- Score appears in leaderboard
- But no activity in feed

**Diagnosis**:

```javascript
testPublishDailyScore('your_username', 1000);
checkActivityPermissions();
```

**Solutions**:

1. **INSERT permission denied**:

   ```sql
   -- Run in Supabase SQL Editor
   CREATE POLICY "Users can insert own activity" ON activity_feed
   FOR INSERT TO authenticated
   WITH CHECK (true);

   GRANT INSERT ON activity_feed TO authenticated;
   ```

2. **Code not publishing** → Verify you have the latest code (after commit XXXXX)

---

## Database Schema Verification

### Required Tables

Run in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('game_results', 'activity_feed', 'users', 'friendships');
```

**Expected**: 4 rows

### Required Policies

Check RLS policies:

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('game_results', 'activity_feed');
```

**Expected policies**:

- `game_results`: "Users can insert own game results", "Users can read all game results"
- `activity_feed`: "Users can insert own activity", "Users can read activity feed"

### Activity Feed Structure

Verify activity_feed table structure:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'activity_feed';
```

**Required columns**:

- `id` (integer)
- `username` (text)
- `type` (text)
- `score` (integer)
- `time_taken` (integer)
- `created_at` (timestamptz)

---

## Manual Database Fixes

### Fix 1: Reset RLS Policies

```sql
-- In Supabase SQL Editor
\i scripts/fix-supabase-permissions.sql
```

### Fix 2: Manually Insert Test Activity

```sql
-- Test insert (replace 'your_username')
INSERT INTO activity_feed (username, type, score, time_taken, created_at)
VALUES ('your_username', 'daily_score', 1000, 15, NOW());

-- Verify
SELECT * FROM activity_feed WHERE username = 'your_username';
```

### Fix 3: Check Game Results

```sql
-- Check if game results are saving
SELECT user_id, score, played_at
FROM game_results
WHERE user_id = 'your_username'
ORDER BY played_at DESC
LIMIT 5;
```

---

## Development Mode Debug Commands

When running `npm run dev`, these commands are auto-loaded in console:

```javascript
// Database health check
checkDatabaseHealth('username');

// Test activity publishing
testPublishDailyScore('username', 1000);

// Check permissions
checkActivityPermissions();

// Clear test data
clearTestActivities('username');
```

---

## Timeline of Fixes

### Before Fix (Issue)

- ❌ Games saved to `game_results` only
- ❌ No entries in `activity_feed`
- ❌ Profile activity empty
- ❌ Friends feed empty

### After Fix (Latest Code)

- ✅ Games save to `game_results` (personal history)
- ✅ Games publish to `activity_feed` (friends feed)
- ✅ Profile shows recent activity
- ✅ Friends feed populates

### Migration Note

**Old games won't appear in activity feed** because they weren't published when played. Only new games (after the fix) will appear in both places.

---

## Still Having Issues?

### 1. Check Browser Console

Look for errors with these prefixes:

- `[DB]` - Database queries
- `[Profile]` - Profile loading
- `[Friends]` - Friends feed
- `[Activity]` - Activity publishing

### 2. Verify Latest Code

```bash
git log --oneline -1
# Should show: "fix: add activity publishing to game completion"
```

### 3. Clear Cache

```javascript
localStorage.clear();
location.reload();
```

### 4. Test in Incognito

Rule out cache/cookie issues

### 5. Check Supabase Dashboard

- Go to Table Editor
- Check `activity_feed` table
- Verify recent entries exist

---

## Support Checklist

When reporting issues, include:

1. [ ] Username
2. [ ] Output from `checkDatabaseHealth()`
3. [ ] Browser console errors
4. [ ] Have you played a game after the fix?
5. [ ] Supabase RLS policies status (from SQL query above)
6. [ ] Screenshot of empty feed/profile

---

## Quick Reference

| Command                         | Purpose                  |
| ------------------------------- | ------------------------ |
| `checkDatabaseHealth('user')`   | Full diagnostic          |
| `testPublishDailyScore('user')` | Test activity publishing |
| `checkActivityPermissions()`    | Verify RLS policies      |
| `clearTestActivities('user')`   | Clean up test data       |

---

**Last Updated**: January 29, 2025
