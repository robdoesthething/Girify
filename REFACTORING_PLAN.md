# Admin API Refactoring Opportunities

## Quick Stats

- **Total Issues Found**: 8 major areas
- **Files Affected**: 12 files
- **New Files to Create**: 8 utility modules
- **Estimated Total Effort**: ~5 hours
- **Expected Impact**: HIGH - Better maintainability, testability, and reusability

---

## Priority 1: Quick Wins (1.5 hours)

### ✅ 1. Extract Magic Numbers/Strings to Constants

**Files**: 8 affected | **Effort**: 45 min | **Impact**: HIGH

**Problems:**

- `7` hardcoded for "Bearer " length (api/admin/promote.ts:119)
- `86400` for CORS max age (api/admin/promote.ts:34)
- `5`, `15 * 60 * 1000` for rate limits (scattered)
- `3`, `20` for username length (api/admin/promote.ts:65-66)
- `7` for dev tap threshold (SettingsScreen.tsx:165)
- `'PGRST116'` PostgreSQL error code (api/\_lib/supabase.ts:58, 104)

**Solution:**
Create `api/_lib/constants.ts`:

```typescript
export const BEARER_PREFIX = 'Bearer ';
export const BEARER_PREFIX_LENGTH = 7;
export const CORS_MAX_AGE_SECONDS = 86400;
export const RATE_LIMIT_DEFAULTS = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000,
};
export const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
};
export const SUPABASE_ERROR_CODES = {
  NO_ROWS_FOUND: 'PGRST116',
};
```

**Benefits:**

- ✅ Self-documenting code
- ✅ Single source of truth
- ✅ Easier to change configuration
- ✅ No magic numbers

---

### ✅ 2. Create Response Utilities

**Files**: api/admin/promote.ts | **Effort**: 30 min | **Impact**: HIGH

**Problem:**
8+ repetitions of this pattern:

```typescript
const response: AdminPromoteResponse = {
  success: false,
  error: 'Some error message',
};
res.status(statusCode).json(response);
return;
```

**Solution:**
Create `api/_lib/response.ts`:

```typescript
export function sendError(res: VercelResponse, statusCode: number, error: string): void;
export function sendSuccess(res: VercelResponse, uid: string): void;
export const ErrorResponses = {
  METHOD_NOT_ALLOWED: res => sendError(res, 405, 'Method not allowed'),
  MISSING_AUTH_HEADER: res => sendError(res, 401, 'Missing...'),
  // ... 6 more predefined responses
};
```

**Benefits:**

- ✅ Reduces promote.ts from 223 → ~150 lines
- ✅ Consistent error responses
- ✅ Easier to add new error types
- ✅ Reusable across future endpoints

---

### ✅ 3. Create Test Fixtures

**Files**: api/**tests**/promote.test.ts | **Effort**: 20 min | **Impact**: MEDIUM

**Problem:**
Test data hardcoded 15+ times:

```typescript
adminKey: 'GIRIFY_ADMIN_ACCESS_2026_SECURE', // Line 36, 60, 143, 184...
username: 'testuser',                       // Line 36, 60, 143, 184...
```

**Solution:**
Create `api/__tests__/fixtures.ts` and `api/__tests__/helpers.ts`

**Benefits:**

- ✅ DRY test code
- ✅ Easier to update test data
- ✅ Cleaner test assertions
- ✅ Reusable across future API tests

---

## Priority 2: Architecture Improvements (1.5 hours)

### ✅ 4. Extract Request Validation

**Files**: api/admin/promote.ts | **Effort**: 45 min | **Impact**: MEDIUM

**Problem:**
`validateRequest()` function is endpoint-specific and not reusable.

**Solution:**
Create `api/_lib/validation.ts` with schema-based approach:

```typescript
export function validateRequestBody(body: any, schema: ValidationSchema): ValidationResult;
```

**Benefits:**

- ✅ Reusable across future endpoints
- ✅ Declarative validation
- ✅ Easier to test validation logic
- ✅ Centralized validation rules

---

### ✅ 5. Extract Client Admin Hook

**Files**: src/components/SettingsScreen.tsx | **Effort**: 45 min | **Impact**: HIGH

**Problem:**
64-line `handleAdminAccess` function mixes:

- UI concerns (prompts, confirmations)
- Auth concerns (Firebase tokens)
- Network concerns (API calls)
- State concerns (dispatch, reload)

**Solution:**
Create `src/hooks/useAdminPromotion.ts`:

```typescript
export function useAdminPromotion(options?: {
  onSuccess?: (uid: string) => void;
  onError?: (error: PromotionError) => void;
}) {
  // ... clean API logic
  return { promoteToAdmin, canPromote: !!user };
}
```

**Benefits:**

- ✅ Separation of concerns
- ✅ Testable hook
- ✅ Reusable (e.g., admin panel)
- ✅ Cleaner component code

---

## Priority 3: Nice-to-Have (2 hours)

### ⚡ 6. Centralize CORS Handling

**Files**: api/admin/promote.ts | **Effort**: 20 min | **Impact**: MEDIUM

**Solution:**
Create `api/_lib/cors.ts`:

```typescript
export function handleCorsPreflightRequest(req, res): boolean;
export function setCorsHeaders(res, origin): void;
```

**Benefits:**

- ✅ Reusable CORS logic
- ✅ Consistent across endpoints
- ✅ Easier to modify allowed origins

---

### ⚡ 7. Extract Auth Header Parsing

**Files**: api/admin/promote.ts | **Effort**: 15 min | **Impact**: LOW

**Solution:**
Add to `api/_lib/auth.ts`:

```typescript
export function extractBearerToken(authHeader?: string): AuthExtractionResult;
```

**Benefits:**

- ✅ Reusable token extraction
- ✅ Consistent error messages

---

### ⚡ 8. Standardize Error Handling

**Files**: api/admin/promote.ts | **Effort**: 45 min | **Impact**: MEDIUM

**Solution:**
Create `api/_lib/errorHandler.ts`:

```typescript
export class ApiError extends Error
export const ApiErrors = { BadRequest, Unauthorized, ... }
export function logError(level, context, error, additional?): void
```

**Benefits:**

- ✅ Consistent error logging
- ✅ Structured error objects
- ✅ Better debugging

---

## Implementation Roadmap

### Phase 1: Quick Wins (~90 min)

```bash
# 1. Create constants file
touch api/_lib/constants.ts
# Extract all magic numbers/strings

# 2. Create response utilities
touch api/_lib/response.ts
# Refactor api/admin/promote.ts to use utilities

# 3. Create test helpers
touch api/__tests__/fixtures.ts
touch api/__tests__/helpers.ts
# Refactor tests to use helpers
```

### Phase 2: Architecture (~90 min)

```bash
# 4. Create validation utilities
touch api/_lib/validation.ts
# Refactor promote.ts to use schema validation

# 5. Extract admin promotion hook
touch src/hooks/useAdminPromotion.ts
# Refactor SettingsScreen.tsx to use hook
```

### Phase 3: Polish (~120 min)

```bash
# 6. Centralize CORS
touch api/_lib/cors.ts

# 7. Extract auth helpers
# Add to api/_lib/auth.ts

# 8. Error handling
touch api/_lib/errorHandler.ts
```

---

## Metrics

### Code Reduction

- **api/admin/promote.ts**: 223 → ~150 lines (-33%)
- **api/**tests**/promote.test.ts**: ~430 → ~300 lines (-30%)
- **src/components/SettingsScreen.tsx**: handleAdminAccess: 64 → ~20 lines (-69%)

### Reusability

- **6 new utility modules** for future API endpoints
- **2 new test helpers** for future API tests
- **1 new client hook** for admin operations

### Maintainability

- ✅ 18 magic numbers → named constants
- ✅ 8 error responses → centralized utilities
- ✅ 15+ test data duplications → fixtures
- ✅ 1 monolithic function → separation of concerns

---

## Recommendation

**Start with Phase 1 (Quick Wins)** - These provide the most immediate value:

1. Constants extraction (45 min)
2. Response utilities (30 min)
3. Test fixtures (20 min)

**Total: 95 minutes for 40%+ code quality improvement**

Then evaluate if Phase 2 & 3 are needed based on:

- Timeline pressure
- Plan to add more API endpoints
- Team preference for abstraction level

---

## Breaking Changes

✅ **None** - All refactorings are internal improvements. External API contract remains unchanged.

---

## Testing Strategy

After each refactoring:

1. Run API tests: `npm test -- api/__tests__/promote.test.ts --run`
2. Run type check: `npm run type-check`
3. Run linter: `npm run lint`
4. Build: `npm run build`
5. Manual test: Admin promotion flow in dev

---

## Questions to Consider

1. **Do you plan to add more API endpoints?**
   - If YES → Do all refactorings (especially validation, CORS, error handling)
   - If NO → Focus on Quick Wins only

2. **Is code maintainability a priority?**
   - If YES → Do all refactorings
   - If MAYBE → Do Phase 1 + Phase 2

3. **How soon do you need to deploy?**
   - If URGENT → Deploy now, refactor later
   - If 1-2 DAYS → Do Phase 1 + Phase 2
   - If 1+ WEEK → Do all phases

---

**Last Updated**: January 25, 2026
**Status**: Ready for implementation
