/**
 * In-memory rate limiting for admin API
 * For production scale, consider migrating to Upstash Redis
 */

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within rate limit
 * @param key Unique identifier (e.g., `${uid}:${ip}`)
 * @param options Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or expired
  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(key, { attempts: 1, resetAt });
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetAt,
    };
  }

  // Increment attempts
  entry.attempts++;
  store.set(key, entry);

  const remaining = Math.max(0, options.maxAttempts - entry.attempts);
  const allowed = entry.attempts <= options.maxAttempts;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific key (useful for testing)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
