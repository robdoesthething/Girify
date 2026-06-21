# Directory Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the root directory of accumulated artifacts and consolidate the admin feature so `src/components/admin/` and scattered admin hooks live under `src/features/admin/`.

**Architecture:** Root cleanup removes generated files and stale docs. The src/ changes colocate reducers with their owning features and merge the split admin feature into a single `src/features/admin/` tree. All import paths are updated in-place — no new abstractions, no behavior changes.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest, React Router v7

## Global Constraints

- Run `npm run type-check` after every task — fix any errors before moving on.
- Run `npm run build` at the end to confirm the production bundle is clean.
- No new files, no new abstractions — only moves and import updates.
- Do not touch `src/utils/social.ts` (re-export shim — harmless, many dependents).
- Do not touch `src/utils/constants.ts` or `src/config/constants.ts` — both are active with different content.

---

## Task 1: Delete root-level generated artifacts

**Files — Delete all of these:**

- `final_lint_report.txt` through `final_lint_v9.txt` (9 files)
- `lint-results.json`, `lint_report.txt`
- `type_check_output.txt`, `type_check_output_2.txt`, `type_check_output_3.txt`, `final_type_check.txt`
- `quality-results.tsv`, `quality.log`, `results.tsv`, `run.log`
- `streets.csv`
- `test-config-service.html`
- `test-supabase-config.js`
- `project_conversations.txt`
- `.firebaserc`
- `program.md`, `research.md`

- [ ] **Step 1: Delete generated artifacts**

```bash
cd /Users/robertosanchezgallego/Desktop/Girify
rm -f final_lint_report.txt final_lint_report_v2.txt final_lint_report_v3.txt \
      final_lint_report_v4.txt final_lint_report_v5.txt final_lint_report_v6.txt \
      final_lint_report_v7.txt final_lint_report_v8.txt final_lint_v9.txt \
      lint-results.json lint_report.txt \
      type_check_output.txt type_check_output_2.txt type_check_output_3.txt final_type_check.txt \
      quality-results.tsv quality.log results.tsv run.log \
      streets.csv test-config-service.html test-supabase-config.js \
      project_conversations.txt .firebaserc program.md research.md
```

Expected: no error output.

- [ ] **Step 2: Confirm only intentional files remain at root**

```bash
ls *.md *.txt *.json *.js *.ts *.html *.sh *.py *.cjs 2>/dev/null | sort
```

Expected output — only these should remain:

```
CHANGELOG.md  CLAUDE.md  CODING_STANDARDS.md  CONTRIBUTING.md
LICENSE  README.md  SECURITY.md  claude.md
add_vercel_env.sh  remove_env_from_history.sh
analyze_tiers.cjs  verify_streets.js  remove_checkerboard.py
commitlint.config.js  eslint.config.js  index.html  package.json
playwright.config.ts  postcss.config.js  tailwind.config.js
tsconfig.json  tsconfig.node.json  vercel.json  vite.config.js
vitest.config.js
```

---

## Task 2: Delete stale session docs from root

These are one-off debug/migration notes written during development. The migration is complete; the bugs are fixed.

**Files — Delete all of these:**

- `ACTIVITY_FEED_FIX_SUMMARY.md`
- `ADMIN_AUTH_IMPLEMENTATION.md`
- `BUG_FIX_ACHIEVEMENTS.md`
- `BUG_FIX_GAME_RESULTS.md`
- `BUG_FIX_IMPLEMENTED.md`
- `BUG_FIX_LEADERBOARD_TIMEZONE.md`
- `BUG_INVESTIGATION_PROFILE_ACTIVITY.md`
- `DEBUGGING_GUIDE.md`
- `FIREBASE_MIGRATION_CHECKLIST.md`
- `FRONTEND_ISSUES_FOUND.md`
- `IMPLEMENTATION_SUMMARY.md`
- `IMPROVEMENT_OPPORTUNITIES.md`
- `IMPROVEMENT_SUMMARY.md`
- `ISSUE_RESOLUTION_SUMMARY.md`
- `ISSUE_RESOLVED.md`
- `MIGRATION_STATUS.md`
- `NEXT_STEPS.md`
- `PHASE1_MIGRATION_GUIDE.md`
- `PHASE1_SUMMARY.md`
- `QUICK_WINS.md`
- `REFACTORING_OPPORTUNITIES.md`
- `REFACTORING_PLAN.md`
- `TESTING_AND_IMPROVEMENTS.md`
- `TROUBLESHOOTING_FRONTEND.md`
- `UI_CONSISTENCY_FIXES.md`
- `USER_PATHWAY_ANALYSIS.md`

- [ ] **Step 1: Delete stale docs**

```bash
cd /Users/robertosanchezgallego/Desktop/Girify
rm -f ACTIVITY_FEED_FIX_SUMMARY.md ADMIN_AUTH_IMPLEMENTATION.md \
      BUG_FIX_ACHIEVEMENTS.md BUG_FIX_GAME_RESULTS.md BUG_FIX_IMPLEMENTED.md \
      BUG_FIX_LEADERBOARD_TIMEZONE.md BUG_INVESTIGATION_PROFILE_ACTIVITY.md \
      DEBUGGING_GUIDE.md FIREBASE_MIGRATION_CHECKLIST.md FRONTEND_ISSUES_FOUND.md \
      IMPLEMENTATION_SUMMARY.md IMPROVEMENT_OPPORTUNITIES.md IMPROVEMENT_SUMMARY.md \
      ISSUE_RESOLUTION_SUMMARY.md ISSUE_RESOLVED.md MIGRATION_STATUS.md \
      NEXT_STEPS.md PHASE1_MIGRATION_GUIDE.md PHASE1_SUMMARY.md QUICK_WINS.md \
      REFACTORING_OPPORTUNITIES.md REFACTORING_PLAN.md TESTING_AND_IMPROVEMENTS.md \
      TROUBLESHOOTING_FRONTEND.md UI_CONSISTENCY_FIXES.md USER_PATHWAY_ANALYSIS.md
```

Expected: no error output.

- [ ] **Step 2: Confirm root .md files**

```bash
ls *.md
```

Expected: `CHANGELOG.md  CLAUDE.md  CODING_STANDARDS.md  CONTRIBUTING.md  LICENSE  README.md  SECURITY.md  claude.md`

---

## Task 3: Move orphan root-level scripts into scripts/

Three utility scripts and two shell scripts live at the project root; they belong in `scripts/`.

**Files:**

- Move: `add_vercel_env.sh` → `scripts/add_vercel_env.sh`
- Move: `remove_env_from_history.sh` → `scripts/remove_env_from_history.sh`
- Move: `analyze_tiers.cjs` → `scripts/analyze_tiers.cjs`
- Move: `verify_streets.js` → `scripts/verify_streets.js`
- Move: `remove_checkerboard.py` → `scripts/remove_checkerboard.py`
- Delete: `measure.js` (if it exists in scripts/ already; it's a one-off perf script)

- [ ] **Step 1: Move scripts**

```bash
cd /Users/robertosanchezgallego/Desktop/Girify
mv add_vercel_env.sh scripts/
mv remove_env_from_history.sh scripts/
mv analyze_tiers.cjs scripts/
mv verify_streets.js scripts/
mv remove_checkerboard.py scripts/
```

Expected: no error output.

- [ ] **Step 2: Confirm root has no stray scripts**

```bash
ls *.sh *.cjs *.py 2>/dev/null
```

Expected: empty output.

---

## Task 4: Remove default Storybook placeholder stories

`src/stories/` contains the boilerplate Button/Header/Page stories that ship with Storybook's starter template. They don't document any real Girify component. The actual project story is `src/components/stories/TopBar.stories.tsx`.

**Delete:** `src/stories/` entire directory.

- [ ] **Step 1: Delete boilerplate Storybook stories**

```bash
rm -rf /Users/robertosanchezgallego/Desktop/Girify/src/stories
```

Expected: no error output.

- [ ] **Step 2: Confirm the real story is untouched**

```bash
ls /Users/robertosanchezgallego/Desktop/Girify/src/components/stories/
```

Expected: `TopBar.stories.tsx`

---

## Task 5: Colocate gameReducer with the game feature

`src/reducers/gameReducer.ts` belongs with the game feature. Only one file imports it.

**Files:**

- Move: `src/reducers/gameReducer.ts` → `src/features/game/gameReducer.ts`
- Modify: `src/features/game/hooks/useGameState.ts:4` — update import path
- Move: `src/reducers/__tests__/gameReducer.test.ts` → `src/features/game/__tests__/hooks/gameReducer.test.ts`

- [ ] **Step 1: Move the reducer and its test**

```bash
mv /Users/robertosanchezgallego/Desktop/Girify/src/reducers/gameReducer.ts \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/game/gameReducer.ts

mv /Users/robertosanchezgallego/Desktop/Girify/src/reducers/__tests__/gameReducer.test.ts \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/game/__tests__/hooks/gameReducer.test.ts
```

- [ ] **Step 2: Update import in useGameState.ts**

File: `src/features/game/hooks/useGameState.ts`, line 4.

Change:

```typescript
import { gameReducer, initialState } from '../../../reducers/gameReducer';
```

To:

```typescript
import { gameReducer, initialState } from '../gameReducer';
```

- [ ] **Step 3: Update import path in the moved test**

Open `src/features/game/__tests__/hooks/gameReducer.test.ts` and update the import that referenced `reducers/gameReducer` to the new relative path `../../gameReducer`.

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: no errors.

---

## Task 6: Colocate profileReducer with the profile feature

`src/reducers/profileReducer.ts` belongs with the profile feature. One file imports it.

**Files:**

- Move: `src/reducers/profileReducer.ts` → `src/features/profile/profileReducer.ts`
- Modify: `src/features/profile/hooks/useProfileState.ts:9` — update import path
- Delete: `src/reducers/` directory (now empty)

- [ ] **Step 1: Move the reducer**

```bash
mv /Users/robertosanchezgallego/Desktop/Girify/src/reducers/profileReducer.ts \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/profile/profileReducer.ts
```

- [ ] **Step 2: Update import in useProfileState.ts**

File: `src/features/profile/hooks/useProfileState.ts`, near line 9.

Change:

```typescript
} from '../../../reducers/profileReducer';
```

To:

```typescript
} from '../profileReducer';
```

- [ ] **Step 3: Delete the now-empty reducers directory**

```bash
rmdir /Users/robertosanchezgallego/Desktop/Girify/src/reducers/__tests__
rmdir /Users/robertosanchezgallego/Desktop/Girify/src/reducers
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: no errors.

---

## Task 7: Move admin hooks into the admin feature

`src/hooks/useAdminCRUD.ts`, `useAdminData.ts`, and `useAdminPromotion.ts` are admin-specific and already have a home at `src/features/admin/hooks/`.

**Files:**

- Move: `src/hooks/useAdminCRUD.ts` → `src/features/admin/hooks/useAdminCRUD.ts`
- Move: `src/hooks/useAdminData.ts` → `src/features/admin/hooks/useAdminData.ts`
- Move: `src/hooks/useAdminPromotion.ts` → `src/features/admin/hooks/useAdminPromotion.ts`

**Import updates needed (5 files):**

| File                                                 | Old import                      | New import                                  |
| ---------------------------------------------------- | ------------------------------- | ------------------------------------------- |
| `src/features/admin/hooks/useAdminAchievements.ts:3` | `'../../../hooks/useAdminCRUD'` | `'./useAdminCRUD'`                          |
| `src/components/admin/AdminAnnouncements.tsx:4`      | `'../../hooks/useAdminCRUD'`    | `'../../features/admin/hooks/useAdminCRUD'` |
| `src/components/admin/AdminShop.tsx:5`               | `'../../hooks/useAdminCRUD'`    | `'../../features/admin/hooks/useAdminCRUD'` |
| `src/components/admin/AdminContent.tsx:3`            | `'../../hooks/useAdminCRUD'`    | `'../../features/admin/hooks/useAdminCRUD'` |
| `src/components/admin/AdminPanel.tsx:5`              | `'../../hooks/useAdminData'`    | `'../../features/admin/hooks/useAdminData'` |

- [ ] **Step 1: Move the three hooks**

```bash
mv /Users/robertosanchezgallego/Desktop/Girify/src/hooks/useAdminCRUD.ts \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/admin/hooks/useAdminCRUD.ts

mv /Users/robertosanchezgallego/Desktop/Girify/src/hooks/useAdminData.ts \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/admin/hooks/useAdminData.ts

mv /Users/robertosanchezgallego/Desktop/Girify/src/hooks/useAdminPromotion.ts \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/admin/hooks/useAdminPromotion.ts
```

- [ ] **Step 2: Update useAdminAchievements.ts**

File: `src/features/admin/hooks/useAdminAchievements.ts:3`

Change:

```typescript
import { useAdminCRUD } from '../../../hooks/useAdminCRUD';
```

To:

```typescript
import { useAdminCRUD } from './useAdminCRUD';
```

- [ ] **Step 3: Update AdminAnnouncements.tsx**

File: `src/components/admin/AdminAnnouncements.tsx:4`

Change:

```typescript
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
```

To:

```typescript
import { useAdminCRUD } from '../../features/admin/hooks/useAdminCRUD';
```

- [ ] **Step 4: Update AdminShop.tsx**

File: `src/components/admin/AdminShop.tsx:5`

Change:

```typescript
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
```

To:

```typescript
import { useAdminCRUD } from '../../features/admin/hooks/useAdminCRUD';
```

- [ ] **Step 5: Update AdminContent.tsx**

File: `src/components/admin/AdminContent.tsx:3`

Change:

```typescript
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
```

To:

```typescript
import { useAdminCRUD } from '../../features/admin/hooks/useAdminCRUD';
```

- [ ] **Step 6: Update AdminPanel.tsx**

File: `src/components/admin/AdminPanel.tsx:5`

Change:

```typescript
import { useAdminData } from '../../hooks/useAdminData';
```

To:

```typescript
import { useAdminData } from '../../features/admin/hooks/useAdminData';
```

- [ ] **Step 7: Type-check**

```bash
npm run type-check
```

Expected: no errors.

---

## Task 8: Move components/admin/ into features/admin/components/

The admin components live in `src/components/admin/` but the admin feature already has `src/features/admin/hooks/`. Consolidating under `src/features/admin/` makes the admin a proper self-contained feature.

**Files — Move entire directory:**

- `src/components/admin/` → `src/features/admin/components/`

**External importers (routes.tsx only):**

| File                | Old import                        | New import                                 |
| ------------------- | --------------------------------- | ------------------------------------------ |
| `src/routes.tsx:23` | `'./components/admin/AdminPanel'` | `'./features/admin/components/AdminPanel'` |
| `src/routes.tsx:24` | `'./components/admin/AdminRoute'` | `'./features/admin/components/AdminRoute'` |

**Internal imports within the moved files** — all `../../utils/social`, `../../hooks/...`, `../../features/admin/hooks/...` paths shift by one level. After the move, `../../` becomes `../../../` for paths escaping `features/admin/components/` to reach `src/`.

- [ ] **Step 1: Move the admin components directory**

```bash
mv /Users/robertosanchezgallego/Desktop/Girify/src/components/admin \
   /Users/robertosanchezgallego/Desktop/Girify/src/features/admin/components
```

- [ ] **Step 2: Update routes.tsx**

File: `src/routes.tsx:23-24`

Change:

```typescript
export const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
export const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
```

To:

```typescript
export const AdminPanel = lazy(() => import('./features/admin/components/AdminPanel'));
export const AdminRoute = lazy(() => import('./features/admin/components/AdminRoute'));
```

- [ ] **Step 3: Fix internal imports in the moved admin components**

All files inside `src/features/admin/components/` that had `../../utils/social` now need `../../../utils/social`. Similarly `../../features/admin/hooks/` becomes `../hooks/`, and `../../hooks/useAdminPromotion` (now moved) becomes `../hooks/useAdminPromotion`.

Run this to find all affected import lines:

```bash
grep -n "from '\.\." /Users/robertosanchezgallego/Desktop/Girify/src/features/admin/components/*.tsx \
  /Users/robertosanchezgallego/Desktop/Girify/src/features/admin/components/index.ts 2>/dev/null | head -60
```

For each file, update relative paths:

- `'../../utils/...'` → `'../../../utils/...'`
- `'../../services/...'` → `'../../../services/...'`
- `'../../data/...'` → `'../../../data/...'`
- `'../../hooks/...'` → `'../hooks/...'` (these are the admin hooks now in `features/admin/hooks/`)
- `'../../features/admin/hooks/...'` → `'../hooks/...'`
- `'../../components/ui/...'` → `'../../../components/ui/...'`
- `'../../context/...'` → `'../../../context/...'`
- `'../../config/...'` → `'../../../config/...'`

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: no errors.

---

## Task 9: Final verification and build

- [ ] **Step 1: Run full type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 2: Run tests**

```bash
npm test -- --run
```

Expected: same pass/fail counts as before (36 pre-existing failures are expected per project memory).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: build succeeds, no import errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: reorganize directory — clean root artifacts, colocate admin feature and reducers"
```

- [ ] **Step 5: Deploy**

```bash
npx vercel --prod
```

Or via the configured deploy skill: `/ship`
