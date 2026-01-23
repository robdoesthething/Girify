# Girify Coding Standards

## Table of Contents

- [CSS & Styling](#css--styling)
- [Components](#components)
- [State Management](#state-management)
- [TypeScript](#typescript)
- [File Organization](#file-organization)
- [Deployment & News](#deployment--news)
- [Commit Messages](#commit-messages)

## CSS & Styling

### Tailwind Utilities Only

Use Tailwind utility classes exclusively. No custom CSS unless absolutely necessary.

**Good**:

```jsx
<div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800">
```

**Bad**:

```jsx
<div style={{ display: 'flex', padding: '24px' }}>
```

### Z-Index Scale

Use increments of 10 for z-index values to maintain clear layering hierarchy:

- `z-10` - Dropdowns, tooltips
- `z-20` - Sticky headers, floating buttons
- `z-30` - Modals, dialogs
- `z-40` - Notifications, toasts
- `z-50` - Critical overlays, error messages

**Good**:

```jsx
<Modal className="z-30" />
<Toast className="z-40" />
```

**Bad**:

```jsx
<Modal className="z-35" /> // Non-standard value
```

### Spacing Consistency

Use standard Tailwind spacing (gap-2, gap-4, gap-6). Avoid odd numbers.

**Good**:

```jsx
<div className="flex gap-4">  // 1rem
<div className="space-y-6">   // 1.5rem
```

**Bad**:

```jsx
<div className="flex gap-3">  // Inconsistent
<div className="space-y-5">   // Avoid odd values
```

## Components

### Maximum 5 Props

Keep components simple with maximum 5 props. If you need more, consider:

- Using compound components
- Creating a configuration object
- Splitting into smaller components

**Good**:

```jsx
function UserCard({ user, onEdit, onDelete, isLoading, className }) {
  // Component logic
}
```

**Bad**:

```jsx
function UserCard({
  name,
  email,
  avatar,
  role,
  isActive,
  onEdit,
  onDelete,
  className,
  showActions,
  isLoading,
}) {
  // Too many props!
}
```

**Better Alternative**:

```jsx
function UserCard({ user, actions, className, isLoading }) {
  // Grouped related data
}
```

### Compound Components

Use compound components for complex UIs with multiple related parts:

**Good**:

```jsx
<Card>
  <Card.Header>
    <Card.Title>User Profile</Card.Title>
  </Card.Header>
  <Card.Body>{/* content */}</Card.Body>
  <Card.Footer>{/* actions */}</Card.Footer>
</Card>
```

### Modal Requirements

All modals must have:

- Backdrop (semi-transparent overlay)
- Close button (visible X or explicit "Close")
- ESC key handler
- Click-outside-to-close (optional but recommended)

**Example**:

```jsx
<Modal onClose={handleClose}>
  <Modal.Backdrop onClick={handleClose} />
  <Modal.Content>
    <Modal.CloseButton onClick={handleClose} />
    {/* modal content */}
  </Modal.Content>
</Modal>
```

## State Management

### Use useReducer for Complex State

When you have more than 3 related state values, use `useReducer` instead of multiple `useState` calls.

**Bad**:

```jsx
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(false);
```

**Good**:

```jsx
const [state, dispatch] = useReducer(formReducer, {
  username: '',
  email: '',
  isLoading: false,
  error: null,
  success: false,
});
```

### Keep State Local

Keep state as close to where it's used as possible. Don't lift state unnecessarily.

**Bad**:

```jsx
// App.jsx - lifting state too high
function App() {
  const [modalOpen, setModalOpen] = useState(false);
  return <ChildComponent modalOpen={modalOpen} setModalOpen={setModalOpen} />;
}
```

**Good**:

```jsx
// ChildComponent.jsx - state stays local
function ChildComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  // Use it here
}
```

### No Prop Drilling Beyond 2 Levels

If you need to pass props more than 2 levels deep, use Context or a state management solution.

**Bad** (3+ levels of prop drilling):

```jsx
<App>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user}>
        <GreatGrandChild user={user} /> // Too deep!
      </GrandChild>
    </Child>
  </Parent>
</App>
```

**Good** (use Context):

```jsx
<UserContext.Provider value={user}>
  <App>
    <Parent>
      <Child>
        <GrandChild>
          <GreatGrandChild /> // Uses useContext
        </GrandChild>
      </Child>
    </Parent>
  </App>
</UserContext.Provider>
```

## TypeScript

### Prefer Type Inference

Let TypeScript infer types when obvious:

**Good**:

```typescript
const count = 5; // TypeScript infers number
const users = ['alice', 'bob']; // string[]
```

**Unnecessary**:

```typescript
const count: number = 5;
const users: string[] = ['alice', 'bob'];
```

### Explicit Return Types for Functions

Always specify return types for exported functions:

**Good**:

```typescript
export function calculateScore(time: number): number {
  return time < 10 ? 1000 : 500;
}
```

**Bad**:

```typescript
export function calculateScore(time: number) {
  return time < 10 ? 1000 : 500;
}
```

## File Organization

### Feature-Based Structure

Organize files by feature, not by type:

**Good**:

```
features/
  auth/
    components/LoginForm.tsx
    hooks/useAuth.ts
    utils/validation.ts
    types.ts
```

**Bad**:

```
components/LoginForm.tsx
hooks/useAuth.ts
utils/authValidation.ts
```

## Deployment & News

### Announcement Requirement

**Every feature deployment or significant change MUST be followed by a user-facing announcement.**

Use the `scripts/publishNews.js` script to create announcements:

```bash
node scripts/publishNews.js
```

**Required Information**:

- Title: Clear, concise description of the change
- Content: 1-3 sentences explaining the feature/fix
- Category: feature | bugfix | maintenance | event
- Publish Date: When it should be visible
- Expiry Date: When to hide it (optional)

**Privacy Rule**: Never include:

- Internal implementation details
- Database schemas or queries
- API keys or credentials
- User-specific data
- Error messages with stack traces

**Good Announcement**:

```
Title: "New Weekly Leaderboard Reset"
Content: "Weekly leaderboards now reset every Monday at midnight!
Compete fresh each week for top scores."
Category: feature
```

**Bad Announcement**:

```
Title: "Fixed database migration issue in users table"
Content: "Updated the SQL schema to handle null values in the
cosmetics.avatar_url field after supabase migration."
Category: bugfix
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no logic change)
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

### Rules

- **Length**: Maximum 100 characters for header
- **Casing**: Subject must be lowercase
- **Mood**: Use imperative mood ("add" not "added")
- **Punctuation**: No trailing period

### Examples

**Good**:

```bash
feat(auth): add email verification step
fix(shop): correct price calculation for bundles
docs(readme): update installation instructions
refactor(game): extract scoring logic to separate hook
test(leaderboard): add tests for rolling 24h filter
```

**Bad**:

```bash
Fixed the login bug.           # No type, capitalized, period
feat(auth): Added verification # Past tense
FEAT: new feature              # Wrong case
feature: this is a really long commit message that exceeds one hundred characters  # Too long
```

### Scope Examples

Use feature names as scopes:

- `auth` - Authentication & authorization
- `shop` - In-game shop
- `game` - Core game logic
- `leaderboard` - Leaderboards & rankings
- `profile` - User profiles
- `friends` - Friend system
- `admin` - Admin panel
- `core` - Core functionality (multiple features)

---

**These standards ensure consistency, maintainability, and quality across the Girify codebase.**
