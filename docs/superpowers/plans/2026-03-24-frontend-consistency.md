# Frontend Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 5 most impactful UI/UX inconsistencies: hardcoded z-indices, duplicate CSS animations, two competing input components, modals bypassing Modal.tsx, and hardcoded buttons bypassing Button.tsx.

**Architecture:** Each task is fully independent and commits clean. No new files are created — this is purely cleanup: replace hardcoded values with existing constants/components, delete the redundant `FormInput` component, and migrate bespoke modal/button implementations to the shared ones.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Framer Motion, Vite

---

## Context for Implementers

### Key files to understand before coding

- `src/config/zIndex.ts` — Z_INDEX constants: OVERLAY=z-10, NAVIGATION=z-20, BACKDROP=z-30, MODAL=z-40, CRITICAL=z-50
- `src/components/ui/Modal.tsx` — shared Modal: props `isOpen`, `onClose`, `title?`, `size?`, `showCloseButton?`, `closeOnBackdrop?`, `children`, `footer?`
- `src/components/ui/Button.tsx` — shared Button: variants `primary|secondary|outline|ghost|danger`, sizes `sm|md|lg`, props `fullWidth?`, `loading?`, `leftIcon?`, `rightIcon?`
- `src/components/ui/Input.tsx` — shared Input: forwardRef, props `label?`, `error?`, `fullWidth?`, `leftIcon?`, `rightIcon?`, `containerClassName?` (added in Task 3)
- `src/utils/themeUtils.ts` — `themeClasses(theme, darkClasses, lightClasses)` utility + `themePresets`
- `src/context/ThemeContext.tsx` — `useTheme()` returns `{ theme, t, language }`

### Rules

- Run `npm run type-check` after every file edit. Fix all errors before moving on.
- Run `npm run lint` before each commit.
- Follow Conventional Commits: `style(scope): description` for visual-only changes, `refactor(scope): description` for component consolidation.
- Never modify business logic. These tasks touch only styling and component structure.

---

## Task 1: Replace hardcoded z-indices with Z_INDEX constants

**Files to modify:**

- `src/components/AnnouncementModal.tsx`
- `src/components/AchievementModal.tsx`
- `src/components/ConfirmDialog.tsx`
- `src/components/TopBar.tsx`
- `src/components/NotificationSystem.tsx`
- `src/components/DistrictSelectionModal.tsx`
- `src/features/auth/components/RegisterPanel.tsx`
- `src/features/game/components/InstructionsOverlay.tsx`
- `src/features/game/components/SummaryScreen.tsx`
- `src/context/LoadingContext.tsx`

**No tests needed** — z-index changes are visual only and not unit-testable.

The `Z_INDEX` constant object (from `src/config/zIndex.ts`) returns Tailwind class strings:

```typescript
import { Z_INDEX } from '../../config/zIndex'; // adjust relative path per file

// Z_INDEX.OVERLAY   = 'z-10'
// Z_INDEX.NAVIGATION = 'z-20'
// Z_INDEX.BACKDROP  = 'z-30'
// Z_INDEX.MODAL     = 'z-40'
// Z_INDEX.CRITICAL  = 'z-50'
```

Use it as a template literal interpolation: ``className={`fixed inset-0 ${Z_INDEX.CRITICAL} flex...`}``

### Replacement mapping

| File                         | Find                          | Replace with                 |
| ---------------------------- | ----------------------------- | ---------------------------- |
| `AnnouncementModal.tsx:34`   | `z-50` on outer wrapper       | `${Z_INDEX.CRITICAL}`        |
| `AchievementModal.tsx:38`    | `z-40` on outer wrapper       | `${Z_INDEX.MODAL}`           |
| `ConfirmDialog.tsx:41`       | `z-50` on outer wrapper       | `${Z_INDEX.CRITICAL}`        |
| `TopBar.tsx:74`              | `z-20` on top bar div         | `${Z_INDEX.NAVIGATION}`      |
| `TopBar.tsx:116`             | `z-30` on menu backdrop       | `${Z_INDEX.BACKDROP}`        |
| `TopBar.tsx:123`             | `z-40` on menu drawer         | `${Z_INDEX.MODAL}`           |
| `TopBar.tsx:212`             | `z-40` on login modal wrapper | `${Z_INDEX.MODAL}`           |
| `NotificationSystem.tsx:51`  | `z-50`                        | `${Z_INDEX.CRITICAL}`        |
| `DistrictSelectionModal.tsx` | any hardcoded z-\*            | appropriate Z_INDEX constant |
| `RegisterPanel.tsx`          | any hardcoded z-\*            | appropriate Z_INDEX constant |
| `InstructionsOverlay.tsx:21` | `z-20`                        | `${Z_INDEX.NAVIGATION}`      |
| `SummaryScreen.tsx:135`      | `z-40`                        | `${Z_INDEX.MODAL}`           |
| `SummaryScreen.tsx:142`      | `z-20`                        | `${Z_INDEX.NAVIGATION}`      |

**Note on inner `z-10` within modals:** When a modal uses `relative z-10` on its content div to sit above its own backdrop (a sibling), that local stacking context is fine and does NOT need to change — it's relative, not global. Only fix the **outer wrapper** z-index (the `fixed inset-0 z-*` class that positions the entire modal in the global stacking context).

- [ ] **Step 1: Fix AnnouncementModal.tsx**

```typescript
// src/components/AnnouncementModal.tsx
// Add import at top:
import { Z_INDEX } from '../config/zIndex';

// Line 34: change
// <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// to:
<div className={`fixed inset-0 ${Z_INDEX.CRITICAL} flex items-center justify-center p-4`}>
```

- [ ] **Step 2: Fix AchievementModal.tsx**

```typescript
// src/components/AchievementModal.tsx
import { Z_INDEX } from '../config/zIndex';

// Line 38: change z-40 to Z_INDEX.MODAL
<div className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center p-4`}>
```

- [ ] **Step 3: Fix ConfirmDialog.tsx**

```typescript
// src/components/ConfirmDialog.tsx
import { Z_INDEX } from '../config/zIndex';

// Line 41: change z-50 to Z_INDEX.CRITICAL
<div className={`fixed inset-0 ${Z_INDEX.CRITICAL} flex items-center justify-center p-4`}>
```

- [ ] **Step 4: Fix TopBar.tsx**

```typescript
// src/components/TopBar.tsx
import { Z_INDEX } from '../config/zIndex';

// Line 74: z-20 → Z_INDEX.NAVIGATION (the top bar itself)
className={`fixed top-0 left-0 right-0 h-12 ${Z_INDEX.NAVIGATION} flex items-center...`}

// Line 116: z-30 → Z_INDEX.BACKDROP (menu backdrop overlay)
className={`fixed inset-0 bg-black/60 ${Z_INDEX.BACKDROP}`}

// Line 123: z-40 → Z_INDEX.MODAL (menu drawer panel)
className={`fixed top-0 bottom-0 left-0 w-64 ${Z_INDEX.MODAL} shadow-2xl flex flex-col...`}

// Line 212: z-40 → Z_INDEX.MODAL (login-required modal wrapper)
<div className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center p-4`}>
```

- [ ] **Step 5: Fix remaining files**

For each remaining file, grep for `z-[0-9]+` in `className`, verify against the stacking table above, and replace. Files: `NotificationSystem.tsx`, `DistrictSelectionModal.tsx`, `RegisterPanel.tsx`, `InstructionsOverlay.tsx`, `SummaryScreen.tsx`, `LoadingContext.tsx`.

- [ ] **Step 6: Type-check**

```bash
npm run type-check
```

Expected: 0 errors

- [ ] **Step 7: Lint**

```bash
npm run lint
```

Expected: 0 errors

- [ ] **Step 8: Commit**

```bash
git add src/components/AnnouncementModal.tsx src/components/AchievementModal.tsx \
  src/components/ConfirmDialog.tsx src/components/TopBar.tsx \
  src/components/NotificationSystem.tsx src/components/DistrictSelectionModal.tsx \
  src/features/auth/components/RegisterPanel.tsx \
  src/features/game/components/InstructionsOverlay.tsx \
  src/features/game/components/SummaryScreen.tsx \
  src/context/LoadingContext.tsx
git commit -m "style(z-index): replace hardcoded z-* values with Z_INDEX constants"
```

---

## Task 2: Deduplicate CSS animations

**Files to modify:**

- `src/index.css`

**Context:** `tailwind.config.js` defines both `scaleIn` and `fadeInUp` animation keyframes. `src/index.css` defines CSS class versions of similar animations. **Important:** these are NOT identical:

- `scale-in` in `index.css` starts at `scale(0)` with a `1.2` overshoot bounce — used for checkmarks in `PlayOverlay.tsx` and `Quiz/Options.tsx`. The Tailwind `scaleIn` starts at `scale(0.95)` with no bounce. **Do NOT delete the CSS `scale-in` block.**
- `fade-in-up` in `index.css` (`opacity:0, translateY(20px)` → `opacity:1, translateY(0)`) is identical to Tailwind's `fadeInUp` keyframe. This one is a true duplicate and can be safely removed.

**Goal:** Remove only the duplicate `@keyframes fade-in-up` and `.animate-fade-in-up` blocks from `index.css`. Keep `scale-in`, `neon-pulse`, `loading-bar`, and all other blocks.

- [ ] **Step 1: Verify tailwind.config.js has the animations**

```bash
grep -A3 "scale-in\|fade-in-up" /Users/robertosanchezgallego/Desktop/Girify/tailwind.config.js
```

Expected: Both `scale-in` and `fade-in-up` present in `theme.extend.animation` and `keyframes`.

- [ ] **Step 2: Verify the classes are still used somewhere**

```bash
grep -r "animate-scale-in\|animate-fade-in-up" src/ --include="*.tsx" --include="*.ts"
```

Note which files use them — after deletion from CSS, Tailwind will still generate them from config, so usages continue to work.

- [ ] **Step 3: Remove only the fade-in-up duplicate from index.css**

In `src/index.css`, delete only this block (approximately lines 215–229):

```css
/* DELETE THIS BLOCK ONLY: */
/* Fade in animations */
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out;
}
```

**Do NOT delete** the `scale-in` block (lines ~196–213). Its bounce keyframe (`scale(0)` → `scale(1.2)` → `scale(1)`) is not equivalent to the Tailwind `scaleIn` animation and is used in `PlayOverlay.tsx` and `Quiz/Options.tsx`.

Keep: `@keyframes scale-in`, `.animate-scale-in`, `@keyframes neon-pulse`, `.blinking-highlight`, `.neon-highlight`, `@keyframes loading-bar`, `.animate-loading-bar`, and everything else.

- [ ] **Step 4: Build to verify no broken animations**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "style(animations): remove duplicate scale-in and fade-in-up from index.css"
```

---

## Task 3: Merge FormInput into Input — add containerClassName prop and migrate admin components

**Files to modify:**

- `src/components/ui/Input.tsx` — add `containerClassName` prop
- `src/components/admin/AdminConfig.tsx`
- `src/components/admin/AdminGameMaster.tsx`
- `src/components/admin/AdminFeedback.tsx`
- `src/components/admin/AdminAnnouncements.tsx`
- `src/components/admin/AchievementEditor.tsx`
- `src/components/admin/QuestEditor.tsx`
- `src/components/admin/IncomeConfig.tsx`
- `src/components/admin/EditUserModal.tsx`
- `src/components/admin/AdminAchievements.tsx`
- `src/components/admin/AdminShopForm.tsx`

**Files to delete:**

- `src/components/FormInput.tsx`

**Context:** `Input.tsx` is the canonical input component with forwardRef, icon support, accessible labels (useId), and error states. `FormInput.tsx` adds only one unique feature: a `containerClassName` prop. It also hard-codes `mb-4` on its wrapper div (anti-pattern — spacing should be the caller's responsibility).

The migration:

1. Add `containerClassName?: string` to `Input.tsx` props
2. Apply `containerClassName` on Input's outer `<div>` (alongside the existing `fullWidth` and `className`)
3. Replace every `import FormInput from '../FormInput'` in admin files with `import Input from '../ui/Input'` and rename usage `<FormInput` → `<Input`
4. Remove the `mb-4` that FormInput added automatically — callers must add spacing themselves (check if admin layouts rely on it and add `mb-4` as explicit `containerClassName="mb-4"` where needed)

- [ ] **Step 1: Add containerClassName to Input.tsx**

Current outer div in `src/components/ui/Input.tsx` (line 43):

```tsx
<div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
```

Add `containerClassName` to the interface and destructuring, then include it on the outer div alongside the existing `className`:

```tsx
// Updated interface (add one line):
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;  // NEW
}

// Updated destructuring (add containerClassName = ''):
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, leftIcon, rightIcon, className = '', containerClassName = '', disabled, id, ...props }, ref) => {

// Updated outer div (keep BOTH className and containerClassName):
<div className={`${fullWidth ? 'w-full' : ''} ${className} ${containerClassName}`}>
```

`className` currently goes on the outer wrapper div (that's its existing behavior — do not change it). `containerClassName` is additive. Both existing callers (using `className`) and the admin migration (using `containerClassName`) work without changes.

- [ ] **Step 2: Run type-check after Input.tsx change**

```bash
npm run type-check
```

Expected: 0 errors

- [ ] **Step 3: Migrate admin components**

For each admin file that imports `FormInput`:

```typescript
// BEFORE:
import FormInput from '../FormInput';
// or
import FormInput from '../../components/FormInput';

// AFTER:
import Input from '../ui/Input';
// or
import Input from '../../components/ui/Input';
```

Then replace every JSX usage:

```tsx
// BEFORE:
<FormInput label="..." error={...} ... />

// AFTER:
<Input label="..." error={...} ... />
```

If any `<FormInput containerClassName="...">` was used, it now maps to `containerClassName` on `<Input>`.

Since FormInput added `mb-4` automatically, check each admin file for vertical spacing. If the layout relies on that gap, add `containerClassName="mb-4"` to the `<Input>` or add a `<div className="mb-4">` wrapper. Most likely the admin forms use `space-y-4` or `gap-4` on the form container, so `mb-4` is redundant — but verify per file.

Do all 10 admin files in this step.

- [ ] **Step 4: Delete FormInput.tsx**

```bash
git rm src/components/FormInput.tsx
```

- [ ] **Step 5: Type-check all changes**

```bash
npm run type-check
```

Expected: 0 errors. Fix any remaining import errors.

- [ ] **Step 6: Lint**

```bash
npm run lint
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Input.tsx src/components/admin/ src/components/FormInput.tsx
git commit -m "refactor(input): merge FormInput into Input, add containerClassName prop"
```

---

## Task 4: Migrate ConfirmDialog and AnnouncementModal to Modal.tsx

**Files to modify:**

- `src/components/ConfirmDialog.tsx`
- `src/components/AnnouncementModal.tsx`
- `src/components/TopBar.tsx` (login-required inline modal)

**Context:** `Modal.tsx` handles ESC key, backdrop click, focus trapping, AnimatePresence, z-index (using Z_INDEX constants), and spring animation. These three components reimplement that logic manually.

**Note on AchievementModal:** Do NOT migrate AchievementModal — it has intentional unique styling (gold border, confetti ray effect, bounce-in animation) that is part of the achievement celebration UX.

### ConfirmDialog migration

ConfirmDialog needs: `isOpen`, `onClose` (maps to `onCancel`), `title`, two-button footer. Use `Modal` with `size="sm"`, custom footer with cancel + confirm buttons.

```tsx
// src/components/ConfirmDialog.tsx — full rewrite

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  const { theme } = useTheme();

  const footer = (
    <>
      <Button variant="ghost" size="md" onClick={onCancel} type="button">
        Cancel
      </Button>
      <Button
        variant={isDangerous ? 'danger' : 'primary'}
        size="md"
        onClick={onConfirm}
        type="button"
      >
        Confirm
      </Button>
    </>
  );

  // NOTE: The non-dangerous confirm button changes from emerald-500 to sky-500 (primary).
  // This is intentional — sky-500 is the app's primary action color; emerald was inconsistent.

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={false}
      footer={footer}
    >
      <p className={`leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
        {message}
      </p>
    </Modal>
  );
};
```

### AnnouncementModal migration

AnnouncementModal has a centered emoji header (not a left-aligned title) and a single "Got it" button. Use `Modal` with `showCloseButton={false}`, `closeOnBackdrop={true}`, no `title` prop (put the header in children), and the button in `footer`.

```tsx
// src/components/AnnouncementModal.tsx — full rewrite

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Announcement } from '../utils/social/news';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onDismiss: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onDismiss }) => {
  const { t } = useTheme();

  const formatDate = (timestamp: Date | string) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const footer = (
    <Button variant="primary" size="lg" fullWidth onClick={onDismiss} type="button">
      {t('gotIt') || 'Got it!'}
    </Button>
  );

  return (
    <Modal
      isOpen={announcement !== null}
      onClose={onDismiss}
      size="md"
      showCloseButton={false}
      closeOnBackdrop={true}
      footer={footer}
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📰</div>
        <h2 className="text-2xl font-black mb-1 font-inter">{announcement?.title}</h2>
        <p className="text-xs opacity-50 font-inter">
          {announcement ? formatDate(announcement.publishDate) : ''}
        </p>
      </div>
      <p className="mb-2 opacity-80 leading-relaxed text-sm max-h-60 overflow-y-auto whitespace-pre-line font-inter">
        {announcement?.body}
      </p>
    </Modal>
  );
};

export default AnnouncementModal;
```

### TopBar login-required modal migration

In `src/components/TopBar.tsx`, replace the inline `AnimatePresence` + custom modal (lines ~210–267) with `Modal`:

```tsx
// Add imports at top:
import Modal from './ui/Modal';
import Button from './ui/Button';

// Replace the entire second AnimatePresence block (showLoginModal) with:
<Modal
  isOpen={showLoginModal}
  onClose={() => setShowLoginModal(false)}
  size="sm"
  showCloseButton={false}
>
  <div className="text-center">
    <h3 className="text-xl font-black mb-2">{t('loginRequired') || 'Login Required'}</h3>
    <p className="mb-6 opacity-70">
      {t('loginRequiredMessage') ||
        'Join the Girify community! Create a profile to track your progress, earn badges, and compete on the leaderboard.'}
    </p>
    <div className="flex flex-col gap-4">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => {
          setShowLoginModal(false);
          onTriggerLogin('signup');
        }}
        type="button"
      >
        {t('signUp')}
      </Button>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => {
          setShowLoginModal(false);
          onTriggerLogin('signin');
        }}
        type="button"
      >
        {t('signIn')}
      </Button>
      <Button
        variant="ghost"
        size="md"
        fullWidth
        onClick={() => setShowLoginModal(false)}
        type="button"
      >
        {t('cancel') || 'Cancel'}
      </Button>
    </div>
  </div>
</Modal>;
```

- [ ] **Step 1: Rewrite ConfirmDialog.tsx** using the code above.

- [ ] **Step 2: Run type-check after ConfirmDialog**

```bash
npm run type-check
```

- [ ] **Step 3: Rewrite AnnouncementModal.tsx** using the code above.

- [ ] **Step 4: Run type-check after AnnouncementModal**

```bash
npm run type-check
```

- [ ] **Step 5: Update TopBar.tsx** — replace the showLoginModal AnimatePresence block with the Modal usage above.

- [ ] **Step 6: Final type-check + lint**

```bash
npm run type-check && npm run lint
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ConfirmDialog.tsx src/components/AnnouncementModal.tsx src/components/TopBar.tsx
git commit -m "refactor(modals): migrate ConfirmDialog, AnnouncementModal, TopBar login modal to Modal.tsx"
```

---

## Task 5: Replace hardcoded buttons with Button component

**Files to modify:**

- `src/components/AnnouncementModal.tsx` — done in Task 4
- `src/components/ConfirmDialog.tsx` — done in Task 4
- `src/components/TopBar.tsx` — done in Task 4
- `src/features/game/components/InstructionsOverlay.tsx`

**Context:** `SummaryScreen.tsx` buttons are intentionally custom (glass panels, gradient CTAs, game-specific UX) — do NOT change them. The remaining clear-cut replacement is InstructionsOverlay which has a single standalone button using emerald-500 styling.

### InstructionsOverlay

The existing button (line 42–47):

```tsx
<button
  onClick={handleNext}
  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 font-bold text-xl transition-all transform hover:scale-105"
>
  {state.username ? t('imReady') : t('next')}
</button>
```

Replace with Button component. The project does not use `tailwind-merge`, so overriding variant colors via `className` is unreliable (Tailwind stylesheet order determines which color wins, not DOM order). Instead, accept sky-500 as the primary color:

```tsx
import Button from '../../../components/ui/Button';

<Button variant="primary" size="lg" onClick={handleNext}>
  {state.username ? t('imReady') : t('next')}
</Button>;
```

The `hover:scale-105` effect from the original is not in Button's base styles — it is dropped as part of this consistency pass (Button uses `active:scale-95` instead, which is the standard interaction pattern across the app).

- [ ] **Step 1: Update InstructionsOverlay.tsx**

Add `import Button from '../../../components/ui/Button';` and replace the hardcoded button with the Button component as shown above.

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/game/components/InstructionsOverlay.tsx
git commit -m "refactor(buttons): replace hardcoded button in InstructionsOverlay with Button component"
```

---

## Verification

After all 5 tasks are committed:

```bash
npm run type-check && npm run lint && npm test -- --run && npm run build
```

All must pass before declaring done.
