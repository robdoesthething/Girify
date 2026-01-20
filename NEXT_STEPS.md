# ⚠️ CRITICAL: SQL Scripts Must Be Run Before Testing

## ✅ Commit Complete

All code changes have been committed successfully:

- Commit: `f994e7e - fix: comprehensive data persistence fix after firebase→supabase migration`
- 9 files changed, 1094 insertions(+), 58 deletions(-)

## 🚨 IMMEDIATE ACTION REQUIRED

The application **will NOT work** until you run the SQL scripts in Supabase. This is not optional.

### Why?

- Row Level Security (RLS) policies are currently blocking all inserts
- Admin UIDs are not in the database
- Users cannot save scores, friendships, or any data

## Step 1: Run SQL Scripts (15 minutes)

### A. Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)

### B. Run fix-supabase-permissions.sql

1. Open file: `scripts/fix-supabase-permissions.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. **IMPORTANT**: Update admin UIDs if needed (lines 16-17)

   ```sql
   -- Replace these with your actual Firebase admin UIDs
   INSERT INTO admins (uid, username, created_at) VALUES
   ('YOUR_FIREBASE_UID_HERE', 'your_username', NOW())
   ```

   To find your Firebase UID:
   - Go to Firebase Console → Authentication
   - Click on your user
   - Copy the UID (long string like `tPqEA75l1WUC8r1p1nhrpA4NM962`)

5. Click **"Run"** button
6. Wait for completion (should take ~5 seconds)
7. Scroll to bottom of results - should see list of policies created

### C. Run seed-test-data.sql (Optional but recommended)

1. Open file: `scripts/seed-test-data.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** button
5. This creates 4 test announcements for /news page

### D. Verify Policies Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see policies like:

- "Users can insert own game results" on game_results
- "Anyone can read announcements" on announcements
- "Users can manage friendships" on friendships
- etc.

## Step 2: Test Each Feature (30 minutes)

### Test 1: Admin Panel Access

**Goal**: Verify admin can access /admin

1. Log in with your admin account
2. Navigate to: `/admin`
3. **Expected**: Should see AdminPanel
4. **If fails**:
   - Check Supabase admins table: `SELECT * FROM admins;`
   - Your UID should be there
   - If not, insert it manually

### Test 2: Score Saving

**Goal**: Verify scores save to Supabase

1. Open browser DevTools (F12) → Console tab
2. Clear console
3. Play a complete game (answer all questions)
4. **Check console for one of these**:
   - ✅ `[Save Success] Game saved: <gameId>` (Redis working)
   - ✅ `[Fallback] Score saved directly to Supabase` (Redis fallback)
   - ❌ `[Save Error] Failed to save game: <error>` (Something wrong)

5. **Verify in Supabase**:

   ```sql
   SELECT * FROM game_results
   ORDER BY played_at DESC
   LIMIT 5;
   ```

   Your game should appear with:
   - Your user_id (Firebase UID)
   - Score you just got
   - Time taken
   - Current timestamp

6. Navigate to `/leaderboard`
7. **Expected**: Your score appears in the list

### Test 3: Announcements

**Goal**: Verify news page works

1. Navigate to `/news`
2. **Expected**: See 4 test announcements (if you ran seed-test-data.sql)
   - "[TEST] Welcome to Girify!"
   - "[TEST] New Features Coming Soon"
   - "[TEST] Weekly Leaderboard Reset"
   - "[TEST] Special Event: Double Giuros Weekend"

3. **If no announcements show**:
   - Check Supabase: `SELECT * FROM announcements WHERE is_active = true;`
   - Check browser console for errors
   - Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'announcements';`

### Test 4: Friends Page

**Goal**: Verify friends page loads

1. Navigate to `/friends`
2. **Expected**: Page loads without errors (may be empty if no friends)
3. Check browser console - should be no errors
4. If you have friends, they should appear

### Test 5: Profile & Game History

**Goal**: Verify user profile shows game history

1. Navigate to `/profile`
2. **Expected**: See your recent games
3. Your latest game should appear in history

## Step 3: Monitor for Issues (Ongoing)

### Console Logs to Watch For

**✅ Success Indicators**:

```
[Save Success] Game saved: xyz123
[Fallback] Score saved directly to Supabase
```

**⚠️ Warnings (Not Critical)**:

```
[Redis] Session not found: xyz123
[Migration] No gameId found - using fallback save
```

These are OK - the fallback mechanism handles them.

**❌ Errors (Need Fixing)**:

```
[Save Error] Failed to save game: permission denied
[Supabase] Failed to save game: ...
[Fallback] Failed to save directly to Supabase: ...
```

If you see these, RLS policies may not be configured correctly.

### Supabase Logs

Check for errors:

1. Supabase Dashboard → Logs
2. Select "Postgres Logs"
3. Look for "permission denied" or "RLS policy" errors

## Common Issues & Fixes

### Issue: "permission denied for table game_results"

**Cause**: RLS policies not created
**Fix**: Re-run `scripts/fix-supabase-permissions.sql`

### Issue: Admin panel redirects to home

**Cause**: Your UID not in admins table
**Fix**:

```sql
INSERT INTO admins (uid, username, created_at) VALUES
('YOUR_FIREBASE_UID', 'your_username', NOW());
```

### Issue: Scores not appearing on leaderboard

**Cause**: Game results not being saved
**Fix**:

1. Check console for error messages
2. Verify RLS policies exist
3. Manually test insert:
   ```sql
   INSERT INTO game_results (user_id, score, time_taken, played_at, platform)
   VALUES ('test_uid', 10, 15.5, NOW(), 'web');
   ```

### Issue: No announcements showing

**Cause**: No announcements in database
**Fix**: Run `scripts/seed-test-data.sql`

## Success Checklist

- [ ] Ran fix-supabase-permissions.sql
- [ ] Verified RLS policies were created
- [ ] Updated admin UIDs in admins table
- [ ] Ran seed-test-data.sql (optional)
- [ ] Can access /admin panel
- [ ] Played complete game
- [ ] Score appears in Supabase game_results table
- [ ] Score appears on /leaderboard
- [ ] /news page shows announcements
- [ ] /friends page loads without errors
- [ ] No "permission denied" errors in console

## After Everything Works

Once all tests pass, you can:

1. **Remove test announcements**:

   ```sql
   DELETE FROM announcements WHERE title LIKE '[TEST]%';
   ```

2. **Re-enable date filters** (Optional):
   - File: `src/services/database.ts:595`
   - Uncomment the date filter lines
   - This will only show announcements within publish/expiry dates

3. **Reduce feed limit** (Optional):
   - File: `src/utils/friends.ts:275`
   - Change `FEED_LIMIT` back to 50

4. **Push to remote** (if everything works):
   ```bash
   git push origin main
   ```

## Need Help?

If something doesn't work:

1. Check browser console for errors
2. Check Supabase logs
3. Verify RLS policies exist
4. Test manual inserts in Supabase
5. Review `IMPLEMENTATION_SUMMARY.md` for detailed troubleshooting

---

**Remember**: The SQL scripts MUST be run before the app will work properly. Don't skip this step!
