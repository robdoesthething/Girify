# Girify UX Research — Game Feel & Polish

You are an autonomous product engineer running UX experiments on Girify,
a daily Barcelona streets quiz game. Your job is to make the game feel more
alive, satisfying, and polished — one targeted file edit at a time.

You work in a loop, forever, until the human interrupts you.

---

## File Ownership

| File                           | Who can touch it       | Purpose                                             |
| ------------------------------ | ---------------------- | --------------------------------------------------- |
| `scripts/quality.js`           | **Nobody** — immutable | Quality gate. Defines what "safe to keep" means.    |
| `src/features/game/`           | **You**                | Game screens, scoring, answer feedback              |
| `src/features/shop/`           | **You**                | Shop UI, item cards, modals                         |
| `src/features/leaderboard/`    | **You**                | Rankings, score display                             |
| `src/features/friends/`        | **You**                | Social UI, empty states, activity feed              |
| `src/features/profile/`        | **You**                | Profile screen polish                               |
| `src/components/ui/`           | **You**                | Shared UI primitives                                |
| `src/i18n/translations.tsx`    | **You**                | Copy — error messages, labels, empty states         |
| `research.md`                  | **The human**          | This file. You read it; you don't modify it.        |
| `quality-results.tsv`          | **You**                | Experiment log. Untracked by git. Never commit it.  |
| `scripts/measure.js`           | **Nobody**             | Performance harness. Out of scope here.             |
| `src/data/streets.ts`          | **Nobody**             | Auto-generated. Do not touch.                       |
| `src/test/`, `**/__tests__/`   | **Nobody**             | Do not modify tests. You may read them for context. |
| `vite.config.js`, `*.config.*` | **Nobody**             | Config files are out of scope here.                 |
| `.env*`                        | **Nobody**             | Off-limits.                                         |

---

## The Gate

A change is KEPT if and only if `quality_status: PASS`.
A change is DISCARDED if `quality_status: FAIL`.

There is no scalar metric to improve — only a floor to stay above.
The direction of improvement is defined by the exploration areas below.

---

## The Loop

```
LOOP FOREVER:

1. Check git state: git log --oneline -5
2. Pick ONE exploration area from the list below.
   Pick ONE specific file to modify within that area.
   Make ONE focused change.
3. git add -A && git commit -m "ux: <short description>"
4. Run the quality gate:
     node scripts/quality.js > quality.log 2>&1
5. Read the result:
     grep "^quality_status:" quality.log
6. If grep is empty (script crashed):
     Run: tail -n 30 quality.log
     If trivially fixable (import typo, wrong path), fix and re-run once.
     Otherwise skip.
7. Record the result in quality-results.tsv (append a row — see format below).
8. If quality_status is PASS → keep the commit. Branch advances.
9. If quality_status is FAIL → git reset --hard HEAD~1. Discard.

NEVER STOP. Do not ask "should I continue?". The human may be asleep.
The loop runs until manually interrupted.
```

---

## quality-results.tsv Format

Tab-separated. Header on first run only. Never commit this file.

```
commit	quality_status	area	description
(baseline)	PASS	—	initial state
a1b2c3d	PASS	score-reveal	animate score number counting up on reveal
b2c3d4e	FAIL	animations	replaced framer-motion with CSS (broke tests)
c3d4e5f	PASS	empty-states	friendlier copy for empty friends list
```

---

## Exploration Areas (work top-to-bottom, then loop)

### 1. Score Reveal Feel

The moment a player sees their score is the emotional peak of the game.
Make it land harder.

**Ideas:**

- Animate the score number counting up (0 → final) over ~600ms when the result screen mounts
- Add a subtle scale pulse on the score when it finishes counting
- Color the score by performance tier: < 400 pts = red-ish, 400–700 = amber, 700+ = green/emerald
- Show a rank badge ("Top 10% today!") if the score places them well on the daily board
- Add a brief confetti burst for perfect or near-perfect rounds (use existing framer-motion)

**Files to target:** `src/features/game/components/ResultScreen.tsx` (or equivalent),
score display components

---

### 2. Correct Answer Celebration

Right now a correct answer just advances the game. That's a missed opportunity.

**Ideas:**

- Brief green flash or ring animation on the map marker when the answer is correct
- "Correct!" text that pops in and fades out (framer-motion AnimatePresence)
- The score delta (+750) floats up and disappears — like a "+750" toast that animates away
- A streak counter that appears after 3+ correct in a row: "🔥 3 streak!"
- Speed bonus text: "Lightning fast! +250 bonus" for sub-3s answers

**Files to target:** `src/features/game/components/`, game feedback components

---

### 3. Loading & Skeleton States

Cold loads feel slow when there's nothing to look at.

**Ideas:**

- Leaderboard: skeleton rows that pulse while data loads (instead of blank space or spinner)
- Profile: skeleton for avatar and stats while data loads
- Shop: skeleton cards before items load
- Friends list: skeleton entries
- Use Tailwind's `animate-pulse` + gray placeholder shapes that match real content layout

**Files to target:** Leaderboard, Profile, Shop, Friends screen components

---

### 4. Empty States

Empty states are often the first thing new users see. Make them warm.

Current empty states are likely generic. Replace with specific, encouraging copy:

| Context                 | Suggested copy                                            |
| ----------------------- | --------------------------------------------------------- |
| No friends yet          | "No friends yet. Share your score and challenge someone!" |
| Empty activity feed     | "No activity yet. Play a round and get on the board."     |
| No game history         | "You haven't played yet. Today's challenge awaits."       |
| Leaderboard: not ranked | "Play today's game to appear on the leaderboard."         |
| Shop: all items owned   | "You own everything. Flex your collection."               |

**Files to target:** `src/i18n/translations.tsx`, individual screen components

---

### 5. Micro-interactions on Interactive Elements

Small details that make the interface feel handcrafted.

**Ideas:**

- Map marker hover: slight scale-up (CSS `hover:scale-105`) so it's clear it's clickable
- Shop item cards: lift shadow on hover (`hover:shadow-lg hover:-translate-y-0.5`)
- Leaderboard rows: subtle highlight on hover for the current user's row
- Button active press: `active:scale-95` on primary CTAs
- Tab switches: ensure the active indicator slides (not jumps) between tabs

**Files to target:** `src/features/shop/components/ShopItemCard.tsx`,
`src/features/leaderboard/`, `src/components/ui/Button.tsx`

---

### 6. Copy & Microcopy Polish

Words are design. Bad copy kills otherwise good UI.

**Ideas:**

- Audit all button labels: replace "Submit" → "Confirm", "OK" → "Got it", generic → specific
- Error messages: replace technical errors with plain language + a suggested action
- Timestamps: "3 days ago" instead of ISO strings in activity feed
- Score descriptions: add flavor text to score tiers in results ("Local knowledge!" / "Street expert!")
- District team names: ensure they're displayed with their full neighborhood name, not just IDs

**Files to target:** `src/i18n/translations.tsx`, any screen with hardcoded strings

---

### 7. Map Interaction Polish

The map is the game. It should feel precise and responsive.

**Ideas:**

- Zoom to the correct location with a smooth animation after the answer is revealed
- Add a subtle pulsing animation on the target pin (correct answer location)
- Show a distance ring/circle that shrinks from the user's guess to the correct point
- Ensure the map tooltip for the guess shows the street name clearly
- Add a small "Your guess" vs "Correct" label to the two pins shown after answering

**Files to target:** map-related components in `src/features/game/`

---

## Constraints

- **One file per commit.** Do not bundle changes across multiple files.
- **No new npm packages.** Work with what's installed: framer-motion, Tailwind, React.
- **No logic changes.** This research is about feel, not behavior. Don't change scoring rules,
  game flow, or data fetching.
- **If a test fails, discard.** Don't modify tests to make them pass your change.
- **Simplicity criterion.** A one-line Tailwind class that improves feel is better than a
  30-line animation component that technically works. Prefer additions of `className` strings,
  small framer-motion variants, and copy changes over structural rewrites.

---

## Starting a Session

Human prompt to kick off:

> "Read research.md, run node scripts/quality.js to confirm baseline, then begin the loop."

The agent should:

1. Read this file
2. Run `node scripts/quality.js > quality.log 2>&1` to confirm baseline PASS
3. Create `quality-results.tsv` with the baseline row
4. Begin the loop starting from Exploration Area 1 (Score Reveal Feel)
