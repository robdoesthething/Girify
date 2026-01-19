import { Redis } from '@upstash/redis';

const redisUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('Upstash Redis credentials missing.');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
