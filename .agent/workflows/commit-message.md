---
description: How to write conventional commit messages that pass commitlint
---

# Conventional Commit Message Format

When suggesting or writing commit messages, ALWAYS follow these rules:

## Format

```
type(scope): subject

[optional body]
```

## Rules (ENFORCED BY COMMITLINT)

1. **Max header length: 100 characters** - The first line (type + scope + subject) must be ≤100 chars
2. **Subject must be lowercase** - Start with lowercase letter after the colon
3. **No trailing period** - Subject must NOT end with a period
4. **Use present tense** - "add feature" not "added feature"

## Valid Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code restructuring, no behavior change
- `test` - Adding/updating tests
- `chore` - Build, CI, dependencies

## Examples

### ✅ CORRECT

```
fix(social): use friends subcollection for friend count
feat(auth): add google oauth login
refactor(quiz): extract scoring logic to helper
docs: update readme with setup instructions
```

### ❌ WRONG

```
Fix(Social): Use friends subcollection for friend count.  ← uppercase, period
feat: implement game state management with gameReducer and new modular quiz UI components  ← too long (>100 chars)
Added new feature  ← no type, past tense
```

## Quick Tips

- Keep the subject line SHORT and descriptive
- Use scope to indicate the area of change (optional but helpful)
- If you need more detail, add a body after a blank line
