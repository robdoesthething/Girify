/**
 * Rate limiting using Upstash Redis
 * Persistent across Vercel serverless cold starts
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[RateLimit] Upstash Redis credentials missing, rate limiting disabled');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

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
 * Check if a request is within rate limit using Redis
 * Falls back to allowing all requests if Redis is unavailable
 * @param key Unique identifier (e.g., `${uid}:${ip}`)
 * @param options Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const client = getRedis();

  if (!client) {
    // If Redis is unavailable, allow the request (fail-open)
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetAt: Date.now() + options.windowMs,
    };
  }

  const redisKey = `ratelimit:${key}`;
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  try {
    // Atomic increment with TTL
    const attempts = await client.incr(redisKey);

    // Set TTL only on first request in window
    if (attempts === 1) {
      await client.expire(redisKey, windowSeconds);
    }

    // Get TTL to calculate resetAt
    const ttl = await client.ttl(redisKey);
    const resetAt = Date.now() + ttl * 1000;

    const remaining = Math.max(0, options.maxAttempts - attempts);
    const allowed = attempts <= options.maxAttempts;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('[RateLimit] Redis error, allowing request:', error);
    // Fail-open: allow request if Redis errors
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetAt: Date.now() + options.windowMs,
    };
  }
}

/**
 * Reset rate limit for a specific key (useful for testing)
 */
export async function resetRateLimit(key: string): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.del(`ratelimit:${key}`);
  }
}
