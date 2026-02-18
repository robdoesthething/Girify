# Deep Code Review Skill

Review staged/unstaged changes (or a specified scope) thoroughly before any code changes are made. For every issue or recommendation, explain concrete tradeoffs, give an opinionated recommendation, and ask for user input before assuming a direction.

## Step 1: Determine Review Scope

Use AskUserQuestion to ask the user:

- **BIG CHANGE**: Full review — up to 4 top issues per section
- **SMALL CHANGE**: Focused review — 1 top issue per section

Also ask the user what to review: staged changes, unstaged changes, a specific file/directory, or the full codebase. Default to staged + unstaged changes if not specified.

## Step 2: Gather Context

Read all files in scope. Understand the change set before reviewing. Use `git diff` and `git diff --cached` to see what changed. Read surrounding code for context.

## Step 3: Run 4 Review Stages Sequentially

Run each stage one at a time. After completing each stage, pause and ask the user for feedback before proceeding to the next.

### Stage 1: Architecture Review

Evaluate:

- System design: does the change fit the existing architecture?
- Component boundaries: are responsibilities clear and well-separated?
- Dependency coupling: are new dependencies justified? Is coupling tight?
- Data flow patterns: is data flowing in expected directions?
- Scaling considerations: will this hold up under growth?

### Stage 2: Code Quality Review

Evaluate:

- DRY violations: flag repetition aggressively
- Error handling gaps: missing error paths, swallowed errors
- Technical debt: shortcuts that will cost later
- Engineering calibration: is the code under-engineered (fragile, hacky) or over-engineered (premature abstraction, unnecessary complexity)? Aim for "engineered enough"

### Stage 3: Test Review

Evaluate:

- Unit test coverage: are new/changed functions tested?
- Integration test coverage: are interactions between components tested?
- E2E test coverage: are user-facing flows covered?
- Weak assertions: tests that pass but don't actually verify behavior
- Untested failure paths: error cases, edge cases, boundary conditions

### Stage 4: Performance Review

Evaluate:

- N+1 queries: unnecessary repeated database calls
- Memory usage: leaks, unnecessary allocations, large objects held in memory
- Caching opportunities: repeated expensive computations or fetches
- Algorithmic complexity: O(n^2) or worse where O(n) is possible

## Issue Documentation Format

For each issue found, present it in this format:

**Issue #N: [Title]**

- **Where**: `file_path:line_number`
- **What**: Clear description of the problem
- **Why it matters**: Concrete impact (performance, maintainability, correctness, etc.)

**Options:**

- **(a) [Recommended approach]** — [1-2 sentence description]. Effort: [low/medium/high]. Risk: [low/medium/high]. Impact: [low/medium/high].
- **(b) [Alternative approach]** — [1-2 sentence description]. Effort/Risk/Impact same format.
- **(c) Do nothing** — [Why this might be acceptable, or why it's not]. Risk of inaction: [description].

**Recommendation**: [Letter] — [Brief justification]

## After Each Stage

Use AskUserQuestion to present the issues found and ask the user which options they prefer for each issue. Present all issues from the current stage together. Include a "Skip this section" option. Wait for user response before moving to the next stage.

## Engineering Preferences

Use these to guide recommendations:

- **DRY is important** — flag repetition aggressively
- **Well-tested code is non-negotiable** — rather too many tests than too few
- **"Engineered enough"** — not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity)
- **Edge case handling** — err on the side of handling more edge cases, not fewer; thoughtfulness > speed
- **Explicit over clever** — bias toward explicit, readable code over clever tricks

## After All 4 Stages

Summarize the user's decisions across all stages into a numbered action plan. Ask for final confirmation before making any code changes. Then implement the approved changes.
