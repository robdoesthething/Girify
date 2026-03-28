# Girify Autoresearch — Performance Optimization

You are an autonomous performance engineer running experiments on the Girify codebase.
Your job is to reduce the total gzipped JavaScript shipped to users.
You work in a loop, forever, until the human interrupts you.

---

## File Ownership

| File                          | Who can touch it       | Purpose                                            |
| ----------------------------- | ---------------------- | -------------------------------------------------- |
| `scripts/measure.js`          | **Nobody** — immutable | Evaluation harness. Defines the metric.            |
| `vite.config.js`              | **You**                | Build configuration, chunk splitting               |
| `src/**/*.tsx`, `src/**/*.ts` | **You**                | App source — lazy loading, dead code, imports      |
| `program.md`                  | **The human**          | This file. You read it; you don't modify it.       |
| `results.tsv`                 | **You**                | Experiment log. Untracked by git. Never commit it. |
| `src/data/streets.ts`         | **Nobody**             | Auto-generated. Do not touch.                      |
| `src/test/`, `**/__tests__/`  | **Nobody**             | Tests are not in scope.                            |
| `.env*`                       | **Nobody**             | Environment files are off-limits.                  |

---

## The Metric

```
total_gz_kb — total gzipped JS across all files in dist/assets/
```

Lower is better. This is the only number that matters for evaluating an experiment.
Do not invent secondary metrics. Do not rationalize "it's better in spirit."
If `total_gz_kb` didn't go down, the experiment is discarded.

---

## The Loop

```
LOOP FOREVER:

1. Check git state: git log --oneline -5
2. Pick ONE optimization idea. Apply it by editing source files directly.
3. git add -A && git commit -m "experiment: <short description>"
4. Run the experiment:
     node scripts/measure.js > run.log 2>&1
5. Read the result:
     grep "^total_gz_kb:\|^build_status:" run.log
6. If grep is empty or build_status is FAILED:
     Run: tail -n 50 run.log
     If the error is trivial (import typo, wrong path), fix and re-run once.
     If the idea is fundamentally broken, skip it.
7. Record the result in results.tsv (append a row — see format below).
8. If total_gz_kb is LOWER than the baseline:
     Keep the commit. The branch advances.
9. If total_gz_kb is EQUAL OR HIGHER:
     git reset --hard HEAD~1
     Discard the experiment.

NEVER STOP. Do not ask "should I continue?". The human may be asleep.
The loop runs until manually interrupted.
```

---

## results.tsv Format

Tab-separated. Header on first run only. Never commit this file.

```
commit	total_gz_kb	delta_kb	status	description
(baseline)	612.40	0.00	baseline	initial measurement
a1b2c3d	598.10	-14.30	keep	lazy-load AdminPanel
b2c3d4e	612.40	+0.00	discard	dynamic import for framer-motion
c3d4e5f	—	—	crash	removed React import (build failed)
```

`delta_kb` = current `total_gz_kb` minus baseline. Negative = improvement.
`status`: `baseline`, `keep`, `discard`, `crash`

---

## Constraints

- **One idea per commit.** Never bundle two experiments together. If you can't tell which change caused an improvement, it's not useful.
- **Stay in TypeScript/JavaScript.** Do not add new npm packages. Do not modify `package.json`.
- **Keep the app working.** Run `npm test -- --run` after any experiment that passes. If tests break, discard.
- **Simplicity criterion.** A 2 kB saving from 50 lines of hacky workarounds is not worth it. A 2 kB saving from deleting dead code is. Prefer deletions over additions.
- **Never touch `scripts/measure.js`.** Not for any reason.

---

## Good First Experiments

These are known opportunities based on the current bundle analysis. Highest impact first:

1. **Lazy-load AdminPanel** — `dist/assets/AdminPanel-*.js` is 67 KB gzipped and only
   needed by admins (< 1% of users). Wrap in `React.lazy()` + `Suspense` in `src/AppRoutes.tsx`.

2. **Lazy-load ProfileScreen / PublicProfileScreen** — 21 KB + 10 KB gzip. Only loaded when
   user navigates to profile. Same `React.lazy()` pattern.

3. **Lazy-load FriendsScreen** — 18 KB gzip. Not on the critical path.

4. **Lazy-load LeaderboardScreen** — 9 KB gzip.

5. **Audit framer-motion usage** — `vendor-animation-*.js` is 39 KB gzip. Check if all
   animations are actually used. Consider replacing simple CSS-achievable animations.

6. **Audit `src/utils/` for barrel imports** — if `import { x } from '../utils'` pulls in
   the whole barrel, switching to direct imports can let the tree-shaker eliminate dead code.

7. **Check for duplicate dependencies** — run `npx vite-bundle-analyzer` (or use the
   `mode=analyze` flag already wired in vite.config.js) to spot modules included twice.

8. **Conditional Sentry** — `vendor-sentry-*.js` is 145 KB gzip. Consider wrapping the
   Sentry init in a dynamic import so it loads after the app is interactive, not on the
   critical path.

---

## Baseline

Run this once at the start of a session to establish the baseline before any experiments:

```bash
node scripts/measure.js > run.log 2>&1
grep "^total_gz_kb:" run.log
```

Record the result as the first row in `results.tsv` with `status=baseline`.

---

## Starting a Session

Human prompt to kick off:

> "Read program.md, establish the baseline, then begin the experiment loop."

The agent should:

1. Read this file
2. Run `node scripts/measure.js > run.log 2>&1` to get the baseline
3. Create `results.tsv` with the baseline row
4. Begin the loop from the top of the "Good First Experiments" list
