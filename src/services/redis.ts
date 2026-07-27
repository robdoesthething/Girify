import { Redis } from '@upstash/redis';
import { env } from '../config/env';

const redisUrl = env.upstashRedisRestUrl;
const redisToken = env.upstashRedisRestToken;

if (!redisUrl || !redisToken) {
  console.error('Upstash Redis credentials missing.');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
