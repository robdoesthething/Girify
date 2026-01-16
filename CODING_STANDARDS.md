# Girify Coding Standards

## CSS

- Use Tailwind utilities only
- Z-index values: 10, 20, 30, 40, 50 (increments of 10)
- Spacing: gap-2, gap-4, gap-6 (no gap-3 or gap-5)

## Components

- Max 5 props per component
- Use compound components for complex UIs
- All modals must have backdrop and close button

## State

- Use useReducer for >3 related state values
- Keep state as local as possible
- No prop drilling >2 levels

## Deployment & News

- **News Required**: Every feature commit or deployment MUST be followed by a News/Announcement update to keep users informed.
- **Privacy**: Never include confidential info in news.
- **Format**: Use the `scripts/publishNews.js` script.

## Commit Messages

- **Format**: Conventional Commits (`type(scope): subject`)
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Length**: Maximum 100 characters for the header.
- **Casing**: Subject must be all lowercase.
- **Punctuation**: No trailing period at the end of the subject.
- **Examples**:
  - ✅ `feat(auth): add email verification step`
  - ✅ `fix(shop): correct price calculation for bundles`
  - ❌ `Fixed the login bug.` (Uppercase, period, no type)
