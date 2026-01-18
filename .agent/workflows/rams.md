---
description: Run a comprehensive design and code quality review
---

# Rams Design & Quality Review

This workflow performs a "sanity check" on the codebase, ensuring it adheres to high standards of code quality (linting, types) and accessibility (good design is understandable).

## Steps

1. **Linting Check**
   - Run `npm run lint` to ensure code style consistency.
   - Fix any auto-fixable errors with `npm run lint:fix`.

2. **Type Safety Check**
   - Run `npm run type-check` to catch potential runtime errors early.
   - Good design is thorough down to the last detail.

3. **Build Verification**
   - Run `npm run build` to ensure the application bundles correctly.
   - Good design is long-lasting; broken builds are not.

4. **Accessibility Review (Manual/Automated)**
   - Check `eslint-plugin-jsx-a11y` output (included in lint).
   - Verify that all images have `alt` tags (Rams principle: make a product understandable).
   - Ensure interactive elements are clear.

## Execution

```bash
echo "🎨 Starting Rams Design & Quality Review..."
npm run lint
npm run type-check
npm run build
echo "✅ Review Complete."
```
