# Phase 1 Migration Guide: Firebase Config → Supabase

This guide provides step-by-step instructions for completing Phase 1 of the Firebase to Supabase migration.

---

## Overview

**Goal**: Migrate configuration data from Firebase Firestore to Supabase PostgreSQL
**Files to Update**: 5 total
**Estimated Time**: 2-3 hours
**Risk Level**: Low (config only, easy rollback)

---

## Step 1: Run SQL Migration (5 minutes)

1. **Open Supabase Dashboard**
   - Navigate to your Girify project
   - Click "SQL Editor" in left sidebar

2. **Execute Migration Script**
   - Open file: `scripts/migrate-config-to-supabase.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Verify success message

3. **Verify Tables Created**

   ```sql
   -- Run these queries to verify:
   SELECT * FROM app_config;
   SELECT * FROM game_config;
   ```

   Expected results:
   - Both queries should return 1 row with id='default'
   - Values should match DEFAULT constants

---

## Step 2: Export Firebase Config Values (10 minutes)

1. **Open Firebase Console**
   - Navigate to your Girify project
   - Go to Firestore Database

2. **Export Payout Config**
   - Find collection: `config`
   - Open document: `settings`
   - Copy the `payouts` object
   - Record values:
     ```
     STARTING_GIUROS: _______
     DAILY_LOGIN_BONUS: _______
     DAILY_CHALLENGE_BONUS: _______
     STREAK_WEEK_BONUS: _______
     PERFECT_SCORE_BONUS: _______
     REFERRAL_BONUS: _______
     ```

3. **Export Game Config**
   - Find collection: `config`
   - Open document: `global`
   - Record values:
     ```
     maintenanceMode: _______
     scoreMultiplier: _______
     giurosMultiplier: _______
     dailyGameLimit: _______
     announcementBar: _______
     enabledShopCategories: _______
     ```

4. **Update FIREBASE_MIGRATION_CHECKLIST.md**
   - Fill in the "Current Firebase Values" section
   - Commit this documentation

5. **Update Supabase (if values differ from defaults)**

   ```sql
   -- Only run if Firebase values are different from defaults
   UPDATE app_config SET
     starting_giuros = <value>,
     daily_login_bonus = <value>,
     daily_challenge_bonus = <value>,
     streak_week_bonus = <value>,
     perfect_score_bonus = <value>,
     referral_bonus = <value>
   WHERE id = 'default';

   UPDATE game_config SET
     maintenance_mode = <value>,
     score_multiplier = <value>,
     giuros_multiplier = <value>,
     daily_game_limit = <value>,
     announcement_bar = <value>,
     enabled_shop_categories = ARRAY['frames', 'titles', 'avatars', 'badges']
   WHERE id = 'default';
   ```

---

## Step 3: Update Code Files (60 minutes)

### Files to Update

Total: **5 files**

#### 1. `src/utils/giuros.ts`

**Current imports:**

```typescript
import { getPayoutConfig } from './configService';
```

**New imports:**

```typescript
import { getPayoutConfig } from '../services/db/config';
```

**Changes needed:**

- Replace import path only
- No other changes required (API is identical)

---

#### 2. `src/components/admin/AdminGiuros.tsx`

**Current imports:**

```typescript
import { getPayoutConfig, updatePayoutConfig } from '../../utils/configService';
```

**New imports:**

```typescript
import { getPayoutConfig, updatePayoutConfig } from '../../services/db/config';
```

**Changes needed:**

- Replace import path only
- Verify admin panel can update config
- Test in browser

---

#### 3. `src/components/admin/EconomyMetrics.tsx`

**Current imports:**

```typescript
import { getPayoutConfig } from '../../utils/configService';
```

**New imports:**

```typescript
import { getPayoutConfig } from '../../services/db/config';
```

**Changes needed:**

- Replace import path only
- Verify metrics display correctly

---

#### 4. `src/components/admin/IncomeConfig.tsx`

**Current imports:**

```typescript
import { getPayoutConfig, updatePayoutConfig, getDefaultPayouts } from '../../utils/configService';
```

**New imports:**

```typescript
import { getPayoutConfig, updatePayoutConfig, getDefaultPayouts } from '../../services/db/config';
```

**Changes needed:**

- Replace import path only
- Verify income config editor works
- Test save functionality

---

#### 5. `src/components/admin/AdminConfig.tsx`

**Current imports:**

```typescript
import { getGameConfig, updateGameConfig } from '../../utils/adminConfig';
```

**New imports:**

```typescript
import { getGameConfig, updateGameConfig } from '../../services/db/config';
```

**Changes needed:**

- Replace import path only
- Verify game config editor works
- Test all fields (maintenance mode, multipliers, etc.)

---

## Step 4: Testing (30 minutes)

### Test Checklist

#### Config Retrieval

- [ ] App loads without errors
- [ ] Console shows no Firebase config errors
- [ ] Console logs show `[Config]` Supabase queries

#### Payout Config

- [ ] Admin panel displays current payout values
- [ ] Editing payout values works
- [ ] Changes persist after refresh
- [ ] New users receive correct starting giuros

#### Game Config

- [ ] Admin panel displays current game config
- [ ] Maintenance mode toggle works
- [ ] Multiplier changes apply correctly
- [ ] Daily game limit works
- [ ] Announcement bar updates

#### Validation

- [ ] Cannot set multipliers < 0.1 or > 10.0
- [ ] Cannot set daily limit < 0 or > 100
- [ ] Error messages display for invalid values

#### Caching

- [ ] Config cached for 5 minutes
- [ ] Cache invalidates on update
- [ ] `clearPayoutCache()` and `clearGameConfigCache()` work

---

## Step 5: Deployment (15 minutes)

### Pre-Deploy Checklist

- [ ] All 5 files updated
- [ ] All tests pass locally
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Git committed with message: `feat(config): migrate from Firebase to Supabase`

### Deploy Steps

1. **Merge to main**

   ```bash
   git checkout main
   git merge feature/config-migration
   git push origin main
   ```

2. **Verify Vercel deployment**
   - Check Vercel dashboard
   - Ensure build succeeds
   - No deployment errors

3. **Post-Deploy Verification**
   - Test production site
   - Check admin panel
   - Verify config loads
   - Monitor error logs

---

## Step 6: Cleanup (10 minutes)

### After 24 Hours in Production (if stable)

- [ ] **Archive old Firebase config files**

  ```bash
  git mv src/utils/configService.ts src/utils/configService.ts.bak
  git mv src/utils/adminConfig.ts src/utils/adminConfig.ts.bak
  git commit -m "chore: archive old Firebase config files"
  ```

- [ ] **Update FIREBASE_MIGRATION_CHECKLIST.md**
  - Mark Phase 1 as complete
  - Add any notes/issues encountered

- [ ] **Update CLAUDE.md**
  - Document new config service location
  - Update "Gotchas & Pitfalls" section

---

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback (< 5 minutes)

1. Revert the merge commit:

   ```bash
   git revert HEAD
   git push origin main
   ```

2. Vercel will auto-deploy previous version

### Code-Only Rollback

1. Update imports back to Firebase:
   ```bash
   # Undo import changes
   git checkout HEAD~1 -- src/utils/giuros.ts
   git checkout HEAD~1 -- src/components/admin/AdminGiuros.tsx
   git checkout HEAD~1 -- src/components/admin/EconomyMetrics.tsx
   git checkout HEAD~1 -- src/components/admin/IncomeConfig.tsx
   git checkout HEAD~1 -- src/components/admin/AdminConfig.tsx
   git commit -m "revert: rollback config migration"
   git push origin main
   ```

### Database Rollback

- **NOT NEEDED**: Supabase tables can coexist with Firebase
- Old Firebase config remains unchanged
- No data loss risk

---

## Common Issues & Solutions

### Issue: "Cannot read property of null"

**Cause**: Supabase table not created or empty
**Solution**: Re-run SQL migration script

### Issue: "Permission denied for table app_config"

**Cause**: RLS policies not created
**Solution**: Check SQL migration ran completely, verify policies exist

### Issue: "Config values are wrong"

**Cause**: Default values used instead of Firebase values
**Solution**: Run UPDATE queries from Step 2 to set correct values

### Issue: TypeScript error "Cannot find module"

**Cause**: Import path incorrect
**Solution**: Verify path is `../../services/db/config` (adjust `..` as needed)

---

## Success Metrics

### Phase 1 Complete When:

- ✅ All 5 files updated
- ✅ Zero Firebase config queries in logs
- ✅ Admin panel works correctly
- ✅ New users receive correct giuros
- ✅ Config changes persist
- ✅ All tests passing
- ✅ 24 hours in production with no errors

---

## File Reference

### Created Files

- `scripts/migrate-config-to-supabase.sql` - SQL migration
- `src/services/db/config.ts` - New Supabase config service
- `FIREBASE_MIGRATION_CHECKLIST.md` - Overall migration tracker
- `PHASE1_MIGRATION_GUIDE.md` - This file

### Files to Update

1. `src/utils/giuros.ts`
2. `src/components/admin/AdminGiuros.tsx`
3. `src/components/admin/EconomyMetrics.tsx`
4. `src/components/admin/IncomeConfig.tsx`
5. `src/components/admin/AdminConfig.tsx`

### Files to Archive (after Phase 1 complete)

- `src/utils/configService.ts` → `src/utils/configService.ts.bak`
- `src/utils/adminConfig.ts` → `src/utils/adminConfig.ts.bak`

---

**Estimated Total Time**: 2-3 hours
**Best Time to Execute**: Off-peak hours (low user activity)
**Recommended**: Test in staging environment first if available

---

**Last Updated**: 2026-01-24
**Created By**: Claude (Phase 1 preparation)
