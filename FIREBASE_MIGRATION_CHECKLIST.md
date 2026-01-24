# Firebase to Supabase Migration Checklist

This document tracks the progress of migrating Firebase Firestore configuration to Supabase PostgreSQL.

**Migration Start Date**: 2026-01-24
**Target Completion**: 2026-03-07 (6 weeks)
**Current Phase**: Phase 1 - Preparation

---

## Phase 1: Preparation (Week 1) - In Progress

### Database Setup

- [x] **Create SQL migration script** for config tables
  - File: `scripts/migrate-config-to-supabase.sql`
  - Tables: `app_config`, `game_config`
  - RLS policies configured
  - Helper functions created

- [ ] **Run SQL migration in Supabase**
  1. Log into Supabase Dashboard
  2. Navigate to SQL Editor
  3. Open `scripts/migrate-config-to-supabase.sql`
  4. Execute the full script
  5. Verify tables created: `app_config`, `game_config`
  6. Verify default rows inserted

- [ ] **Export current Firebase config values**
  - [ ] Export `config/settings` document (payouts)
    - Log into Firebase Console
    - Navigate to Firestore Database
    - Find `config/settings` document
    - Copy current payout values
    - Document below in [Current Firebase Values](#current-firebase-values)
  - [ ] Export `config/global` document (game settings)
    - Find `config/global` document
    - Copy current game config values
    - Document below in [Current Firebase Values](#current-firebase-values)

- [ ] **Update Supabase with actual Firebase values** (if different from defaults)

  ```sql
  -- Run this in Supabase SQL Editor after exporting Firebase values
  UPDATE app_config SET
    starting_giuros = ?,
    daily_login_bonus = ?,
    daily_challenge_bonus = ?,
    streak_week_bonus = ?,
    perfect_score_bonus = ?,
    referral_bonus = ?
  WHERE id = 'default';

  UPDATE game_config SET
    maintenance_mode = ?,
    score_multiplier = ?,
    giuros_multiplier = ?,
    daily_game_limit = ?,
    announcement_bar = ?,
    enabled_shop_categories = ARRAY[?, ?, ?, ?]
  WHERE id = 'default';
  ```

### Code Changes

- [x] **Create Supabase config service**
  - File: `src/services/db/config.ts`
  - Functions:
    - `getPayoutConfig()` ✅
    - `updatePayoutConfig()` ✅
    - `getGameConfig()` ✅
    - `updateGameConfig()` ✅
  - Caching implemented (5 min TTL) ✅
  - Type safety maintained ✅

- [ ] **Update files importing from configService.ts**
  - [ ] Find all imports: `grep -r "from.*configService" src/`
  - [ ] Replace imports with new Supabase service
  - Files to update (estimated):
    - `src/utils/giuros.ts`
    - `src/features/auth/hooks/useAuth.ts`
    - Admin panel components
    - Game components

- [ ] **Update files importing from adminConfig.ts**
  - [ ] Find all imports: `grep -r "from.*adminConfig" src/`
  - [ ] Replace imports with new Supabase service
  - Files to update (estimated):
    - `src/components/admin/AdminGameMaster.tsx`
    - Game logic components

### Testing

- [ ] **Test config retrieval**
  - [ ] Verify `getPayoutConfig()` returns correct values
  - [ ] Verify `getGameConfig()` returns correct values
  - [ ] Test caching behavior (5 min TTL)
  - [ ] Test fallback to defaults on error

- [ ] **Test config updates (Admin Panel)**
  - [ ] Verify `updatePayoutConfig()` persists changes
  - [ ] Verify `updateGameConfig()` persists changes
  - [ ] Verify validation works (multiplier limits, game limits)
  - [ ] Verify cache invalidation on update

- [ ] **Integration testing**
  - [ ] New users receive correct starting giuros
  - [ ] Daily bonus awards correct amount
  - [ ] Score/giuros multipliers apply correctly
  - [ ] Maintenance mode works
  - [ ] Shop categories filter correctly

### Documentation

- [x] **Create migration checklist** (this file)
- [ ] **Document current Firebase values** (see section below)
- [ ] **Update CLAUDE.md** with Supabase config info
- [ ] **Update README.md** deployment instructions

---

## Phase 2: Config Migration (Week 2) - Not Started

### Code Migration

- [ ] **Replace configService.ts with Supabase version**
  - [ ] Update all imports across codebase
  - [ ] Remove Firebase imports from config files
  - [ ] Test all affected components

- [ ] **Replace adminConfig.ts with Supabase version**
  - [ ] Update all imports across codebase
  - [ ] Remove Firebase imports
  - [ ] Test admin panel

- [ ] **Update admin panel UI**
  - [ ] Verify payout editor works with Supabase
  - [ ] Verify game config editor works
  - [ ] Add success/error messaging

### Cleanup

- [ ] **Remove Firebase config files** (after verification)
  - [ ] Archive `src/utils/configService.ts` → `src/utils/configService.ts.bak`
  - [ ] Archive `src/utils/adminConfig.ts` → `src/utils/adminConfig.ts.bak`
  - [ ] Update imports to use `src/services/db/config.ts`

- [ ] **Remove Firestore imports** from config-related files
  - [ ] Remove `import { doc, getDoc, setDoc } from 'firebase/firestore'`
  - [ ] Remove `import { db } from '../firebase'`

---

## Phase 3: Metrics Migration (Week 3) - Not Started

- [ ] Migrate `src/utils/metrics.ts` to Supabase
- [ ] Update admin dashboard queries
- [ ] Remove Firestore batch operations

---

## Phase 4: Notifications (Week 4) - Not Started

- [ ] Decision: Keep FCM or remove?
- [ ] If keeping: Implement service worker + backend
- [ ] If removing: Delete notification code

---

## Phase 5: Auth System (Week 5-6) - Not Started

- [ ] Create dual-auth system (Firebase + Supabase parallel)
- [ ] Test migration path with test users
- [ ] Gradual rollout plan

---

## Phase 6: Cleanup (Week 7+) - Not Started

- [ ] Remove all Firebase dependencies
- [ ] Delete firebase.ts configuration
- [ ] Update environment variables
- [ ] Verify all tests pass

---

## Current Firebase Values

**IMPORTANT**: Fill this in after exporting from Firebase Console

### Payout Config (`config/settings` document)

```json
{
  "STARTING_GIUROS": __FILL_IN__,
  "DAILY_LOGIN_BONUS": __FILL_IN__,
  "DAILY_CHALLENGE_BONUS": __FILL_IN__,
  "STREAK_WEEK_BONUS": __FILL_IN__,
  "PERFECT_SCORE_BONUS": __FILL_IN__,
  "REFERRAL_BONUS": __FILL_IN__
}
```

### Game Config (`config/global` document)

```json
{
  "maintenanceMode": __FILL_IN__,
  "scoreMultiplier": __FILL_IN__,
  "giurosMultiplier": __FILL_IN__,
  "dailyGameLimit": __FILL_IN__,
  "announcementBar": "__FILL_IN__",
  "enabledShopCategories": ["__FILL_IN__"]
}
```

---

## Files Created/Modified

### Phase 1 - Created

- ✅ `scripts/migrate-config-to-supabase.sql` - SQL migration script
- ✅ `src/services/db/config.ts` - Supabase config service
- ✅ `FIREBASE_MIGRATION_CHECKLIST.md` - This file

### Phase 1 - To Modify

- ⏳ All files importing `configService.ts`
- ⏳ All files importing `adminConfig.ts`
- ⏳ Admin panel components
- ⏳ `CLAUDE.md` - Update with new config service info

---

## Rollback Plan

If migration fails at any phase:

1. **Revert code changes**: `git revert` commits
2. **Re-enable Firebase services**: Update imports back to Firebase
3. **Keep Supabase tables**: They can coexist with Firebase
4. **Document issues**: Add to this file for future attempts

---

## Success Criteria

### Phase 1 Complete When:

- [x] SQL migration script created and tested
- [x] Supabase config service created
- [ ] All imports updated to use Supabase
- [ ] Admin panel can read/write config to Supabase
- [ ] Zero Firebase config reads in production logs
- [ ] All tests pass

---

## Notes & Issues

### 2026-01-24

- Created SQL migration with two tables: `app_config` and `game_config`
- Created Supabase service matching Firebase API
- Maintained caching behavior (5 min TTL)
- Added validation for multipliers and game limits
- RLS policies allow public read, service role update
- Helper functions created for easy querying

### Known Issues

- None yet

### Questions

- Should we keep 5 min cache TTL or reduce for admin changes?
- Do we need audit log for config changes?

---

## Next Actions (Immediate)

1. **Run SQL migration** in Supabase Dashboard
2. **Export Firebase config values** from Firestore Console
3. **Update Supabase** with actual production values (if different from defaults)
4. **Find and list all files** importing configService.ts and adminConfig.ts
5. **Begin updating imports** one file at a time
6. **Test in development** before deploying

---

## Team Sign-Off

- [ ] **Developer**: Reviewed and ready to execute Phase 1
- [ ] **Admin**: Firebase values exported and documented
- [ ] **QA**: Test plan reviewed
- [ ] **Product**: Migration timeline approved

---

**Last Updated**: 2026-01-24
**Updated By**: Claude (Phase 1 preparation)
