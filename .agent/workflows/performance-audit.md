---
description: Run a comprehensive autonomous performance audit of this TypeScript codebase
---

Run a comprehensive autonomous performance audit of this TypeScript codebase. Create parallel sub-tasks for:

1. React rendering inefficiencies (unnecessary re-renders, missing memoization, expensive computations in render paths)
2. Bundle size optimization (unused imports, heavy dependencies with lighter alternatives, code-splitting opportunities)
3. Data-fetching patterns (waterfall requests, missing caching, redundant API calls)
4. CSS and asset optimization

For each finding, assign a severity score (1-10) based on estimated performance impact. Then systematically fix all severity 7+ issues, running the existing test suite after each change to ensure nothing breaks. Commit each logical group of fixes separately with detailed commit messages explaining the before/after impact.
