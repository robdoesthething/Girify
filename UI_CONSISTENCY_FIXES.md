# UI Consistency Fixes - Girify

**Audit Date**: January 29, 2026
**Files Analyzed**: 50+ components
**Issues Found**: 45 inconsistencies

---

## Executive Summary

The Girify UI has **critical inconsistencies** in:

- ❌ Z-index values (violating defined scale)
- ❌ Button styling (4+ different patterns)
- ❌ Modal styling (3 different opacity/padding combos)
- ❌ Form inputs (2 different padding standards)
- ❌ Loading spinners (different sizes and styles)

**Estimated Fix Time**: ~12 hours
**Impact**: Professional, cohesive UI + easier maintenance

---

## 🔴 CRITICAL FIXES (Do First - 4 hours)

### 1. Fix Z-Index Violations (1 hour)

**Problem**: Using non-standard values that conflict with accessibility and modal stacking.

**Current Violations**:

```typescript
// TopBar.tsx - WRONG
z - [4000]; // Navigation
z - [6000]; // Menu backdrop
z - [7000]; // Menu panel
z - [8000]; // Login modal

// ConfirmDialog.tsx - WRONG
z - [9999]; // Confirm dialog

// AchievementModal.tsx - WRONG
z - [9000]; // Achievement modal
```

**Standard (from CODING_STANDARDS.md)**:

```
z-10  = Dropdowns, tooltips
z-20  = Sticky headers, floating buttons
z-30  = Modals, dialogs
z-40  = Notifications, toasts
z-50  = Critical overlays
```

**Fix**:

```typescript
// src/components/TopBar.tsx
- className="... z-[4000]"
+ className="... z-20"  // Navigation bar

- className="... z-[6000]"
+ className="... z-30"  // Modal backdrop

- className="... z-[7000]"
+ className="... z-40"  // Menu panel

- className="... z-[8000]"
+ className="... z-50"  // Login modal (highest priority)

// src/components/ConfirmDialog.tsx
- className="... z-[9999]"
+ className="... z-50"  // Critical confirmation

// src/components/AchievementModal.tsx
- className="... z-[9000]"
+ className="... z-40"  // Achievement notification
```

**Test**: Open menu, then achievement modal - should stack correctly

---

### 2. Standardize Button Variants (2 hours)

**Problem**: Buttons have 4+ different styling patterns across the app.

**Create Component**: `src/components/ui/Button.tsx`

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl',
        secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white',
        outline: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white',
        ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
      },
      size: {
        sm: 'px-4 py-2 rounded-lg text-sm',
        md: 'px-6 py-3 rounded-xl text-base',
        lg: 'px-8 py-4 rounded-2xl text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
```

**Install dependency**:

```bash
npm install class-variance-authority
```

**Replace Existing Buttons**:

```typescript
// Before (LandingPage.tsx line 92-115)
<motion.button
  className="relative px-10 py-5 rounded-2xl bg-gradient-to-r from-sky-500..."
  onClick={handlePlayClick}
>
  {t('playDaily')}
</motion.button>

// After
import { Button } from '@/components/ui/Button';

<Button size="lg" variant="primary" onClick={handlePlayClick}>
  {t('playDaily')}
</Button>
```

**Files to Update**:

- LandingPage.tsx (primary CTA)
- TopBar.tsx (auth buttons)
- ShopScreen.tsx (purchase/login buttons)
- LeaderboardScreen.tsx (retry button)
- FriendsScreen.tsx (request buttons)
- ProfileScreen.tsx (edit/logout buttons)

---

### 3. Unify Modal Styling (1 hour)

**Problem**: Modals have different backdrop opacity, padding, and structure.

**Create Component**: `src/components/ui/Modal.tsx`

```typescript
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - STANDARD: bg-black/60 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Modal - STANDARD: z-50, p-6 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`
                relative w-full ${sizeClasses[size]}
                bg-white dark:bg-slate-900
                rounded-2xl shadow-2xl p-6
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Replace Existing Modals**:

```typescript
// Before (ConfirmDialog.tsx)
<AnimatePresence>
  {isOpen && (
    <>
      <div className="fixed inset-0 bg-black/60 z-[9999]" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] ...">
        {/* Complex modal structure */}
      </div>
    </>
  )}
</AnimatePresence>

// After
import { Modal } from '@/components/ui/Modal';

<Modal isOpen={isOpen} onClose={onClose} size="sm">
  <h2 className="text-xl font-bold mb-4">{title}</h2>
  <p className="mb-6">{message}</p>
  <div className="flex gap-4">
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="danger" onClick={onConfirm}>Confirm</Button>
  </div>
</Modal>
```

---

## 🟡 HIGH PRIORITY (Next - 4 hours)

### 4. Standardize Form Inputs (1 hour)

**Problem**: Inputs have different padding (px-3 vs px-4).

**Standard**: Always use `px-4 py-3`

**Fix FormInput.tsx**:

```typescript
// src/components/FormInput.tsx (line 29-34)
<input
-  className="px-3 py-2 rounded-xl border ..."
+  className="px-4 py-3 rounded-xl border ..."
  // ... rest
/>
```

**Apply to all inputs**:

- FormInput.tsx
- AuthFormFields.tsx (already correct)
- Search inputs in FriendsScreen.tsx

---

### 5. Fix Disabled Button States (1 hour)

**Problem**: Disabled buttons sometimes invisible or unclear.

**Issue in ShopItemCard.tsx (line 114-121)**:

```typescript
// WRONG - Button disappears when disabled
<button
  disabled={!canPurchase}
  className={`... ${!canPurchase ? 'cursor-not-allowed opacity-0' : ''}`}
>
```

**Fix**:

```typescript
<Button
  disabled={!canPurchase}
  variant={!canPurchase ? 'secondary' : 'primary'}
  size="md"
>
  {!canPurchase ? 'Locked' : `Buy for ${item.cost} Giuros`}
</Button>
```

**Apply Button component** which handles disabled state correctly:

- `disabled:opacity-50` (visible but clearly disabled)
- `disabled:cursor-not-allowed`

---

### 6. Unify Card Styling (1 hour)

**Problem**: Cards use different borders (1px, 2px, 4px) and backgrounds.

**Standard Card Component**: `src/components/ui/Card.tsx`

```typescript
import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-2xl transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
        glass: 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20',
        elevated: 'bg-white dark:bg-slate-900 shadow-lg',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-xl hover:-translate-y-1',
        scale: 'hover:scale-[1.02]',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
    },
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
}

export function Card({ variant, padding, hover, className, children }: CardProps) {
  return (
    <div className={cardVariants({ variant, padding, hover, className })}>
      {children}
    </div>
  );
}
```

**Usage**:

```typescript
// Shop item card
<Card variant="glass" padding="md" hover="scale">
  {/* content */}
</Card>

// Leaderboard entry
<Card variant="default" padding="sm" hover="lift">
  {/* content */}
</Card>

// Feature card on landing
<Card variant="glass" padding="lg">
  {/* content */}
</Card>
```

---

### 7. Standardize Loading States (1 hour)

**Problem**: Spinners have different sizes (8px, 10px) and borders.

**Standard Spinner Component**: `src/components/ui/Spinner.tsx`

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={`
        animate-spin rounded-full
        border-sky-500 border-t-transparent
        ${sizeClasses[size]}
        ${className}
      `}
    />
  );
}
```

**Usage**:

```typescript
// In Button (already included in Button component)
<Button isLoading>Loading...</Button>

// Page-level loading
<div className="flex justify-center items-center min-h-screen">
  <Spinner size="lg" />
</div>

// Inline loading
<Spinner size="sm" className="inline-block" />
```

**Replace in files**:

- ShopScreen.tsx (line 167-169)
- FriendsScreen.tsx (line 146-148)
- LeaderboardScreen.tsx (line 105-110)

---

## 🟢 MEDIUM PRIORITY (Backlog - 4 hours)

### 8. Standardize Typography Scale (1.5 hours)

**Problem**: Headings have inconsistent hierarchy.

**Create Typography System**: `tailwind.config.js`

```javascript
theme: {
  extend: {
    fontSize: {
      // Headings
      'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '900' }],  // Landing hero
      'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '800' }],       // Page titles
      'h2': ['2rem', { lineHeight: '1.3', fontWeight: '700' }],         // Section titles
      'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '700' }],       // Card titles
      'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],      // Subsections

      // Body
      'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
      'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
      'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],

      // UI
      'button-lg': ['1.125rem', { fontWeight: '700' }],
      'button': ['1rem', { fontWeight: '700' }],
      'button-sm': ['0.875rem', { fontWeight: '600' }],
      'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
    },
  },
}
```

**Apply Consistently**:

```typescript
// Landing page
<h1 className="text-display">Welcome to Girify</h1>

// Screen headings
<h1 className="text-h1">Shop</h1>
<h1 className="text-h1">Leaderboard</h1>
<h1 className="text-h1">Friends</h1>

// Section headings
<h2 className="text-h2">Recent Activity</h2>

// Card titles
<h3 className="text-h3">Daily Challenge</h3>
```

---

### 9. Unify Tab Styling (1 hour)

**Problem**: Three different tab patterns across screens.

**Standard Tabs Component**: `src/components/ui/Tabs.tsx`

```typescript
import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors
              ${activeTab === tab.id
                ? 'bg-sky-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-4 py-3 font-bold text-sm uppercase tracking-wider
            border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-sky-500 text-sky-500'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
```

**Usage**:

```typescript
// FriendsScreen - use underline variant
<Tabs
  variant="underline"
  tabs={[
    { id: 'friends', label: 'Friends', badge: friends.length },
    { id: 'requests', label: 'Requests', badge: requests.length },
    { id: 'feed', label: 'Feed' },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>

// LeaderboardScreen - use pills variant
<Tabs
  variant="pills"
  tabs={[
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'all', label: 'All Time' },
  ]}
  activeTab={period}
  onChange={setPeriod}
/>
```

---

### 10. Standardize Empty States (1 hour)

**Problem**: No consistent pattern for empty/no-data states.

**Standard Empty State**: `src/components/ui/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon?: string; // emoji
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl mb-4">{icon}</span>
      <h3 className="text-h3 mb-2">{title}</h3>
      {description && (
        <p className="text-body text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
```

**Usage**:

```typescript
// No leaderboard data
<EmptyState
  icon="📭"
  title="No records yet"
  description="Be the first to play today's challenge!"
  action={{ label: 'Play Now', onClick: () => navigate('/game') }}
/>

// No friends
<EmptyState
  icon="👥"
  title="No friends yet"
  description="Add friends to see their activity and compete!"
  action={{ label: 'Find Friends', onClick: () => setActiveTab('search') }}
/>

// No activity
<EmptyState
  icon="💤"
  title="No recent activity"
  description="Your friends haven't played any games recently."
/>
```

---

### 11. Standardize Hover Effects (30 min)

**Problem**: Scale transforms range from 1.02 to 1.05.

**Standard**:

- Cards/Lists: `hover:scale-[1.01]` (subtle)
- Buttons: `active:scale-95` (already in Button component)
- Landing CTA: `hover:scale-105` (special emphasis, keep as-is)

**Fix**:

```typescript
// LeaderboardScreen entries
- className="hover:scale-[1.02]"
+ className="hover:scale-[1.01]"

// Card hover prop in Card component
hover: {
  lift: 'hover:shadow-xl hover:-translate-y-1',
  scale: 'hover:scale-[1.01]',  // ← standardized
}
```

---

## ⚪ LOW PRIORITY (Polish - 2 hours)

### 12. Standardize Icon Sizes

**Standard**:

- Small icons: `w-4 h-4`
- Medium icons: `w-5 h-5`
- Large icons: `w-6 h-6`
- Emojis: `text-2xl` (32px)

### 13. Standardize Animation Timings

**Standard (in index.css)**:

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

**Use in components**:

```typescript
className = 'transition-all duration-[var(--duration-normal)]';
```

### 14. Fix Color Semantic Mapping

**Standard colors for states**:

```typescript
const statusColors = {
  success: 'emerald', // emerald-500, emerald-600
  error: 'red', // red-500, red-600
  warning: 'amber', // amber-500, amber-600
  info: 'sky', // sky-500, sky-600
};
```

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Foundation (Week 1 - 4 hours)

- [ ] Fix z-index violations (1h)
- [ ] Create Button component (2h)
- [ ] Create Modal component (1h)

**Deliverable**: Consistent modals and buttons across app

### Phase 2: Forms & Cards (Week 2 - 4 hours)

- [ ] Standardize form inputs (1h)
- [ ] Fix disabled button states (1h)
- [ ] Create Card component (1h)
- [ ] Create Spinner component (1h)

**Deliverable**: Consistent interactive elements

### Phase 3: Polish (Week 3 - 4 hours)

- [ ] Typography system (1.5h)
- [ ] Tabs component (1h)
- [ ] Empty state component (1h)
- [ ] Hover effects standardization (30min)

**Deliverable**: Complete design system

---

## FILES TO CREATE

```
src/components/ui/
├── Button.tsx           ✨ NEW
├── Modal.tsx            ✨ NEW
├── Card.tsx             ✨ NEW
├── Spinner.tsx          ✨ NEW
├── Tabs.tsx             ✨ NEW
├── EmptyState.tsx       ✨ NEW
└── index.ts             ✨ NEW (barrel export)
```

---

## TESTING CHECKLIST

After implementing fixes:

- [ ] All modals open/close correctly
- [ ] Z-index stacking works (menu → modal → dialog)
- [ ] Buttons show proper disabled/loading states
- [ ] Forms have consistent padding and focus states
- [ ] Cards have consistent borders and shadows
- [ ] Loading spinners are same size
- [ ] Tabs work across all screens
- [ ] Empty states display properly
- [ ] No visual regressions
- [ ] Dark mode still works

---

## METRICS

**Before**:

- 4+ button patterns
- 3 modal patterns
- 2 input patterns
- 6+ z-index values
- Inconsistent spacing

**After**:

- 1 Button component with variants
- 1 Modal component
- 1 Input standard
- 5 z-index values (standardized)
- Consistent design tokens

**Developer Experience**:

- Easier to build new features
- Faster development (reusable components)
- Less CSS to maintain
- Better TypeScript autocomplete

---

**Generated**: January 29, 2026
**Total Issues**: 45
**Estimated Fix Time**: 12 hours
**Priority**: High - Affects user experience and brand perception
