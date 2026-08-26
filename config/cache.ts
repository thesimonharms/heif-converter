import type { CacheConfig } from '@pondoknusa/cache';
import { env } from '@pondoknusa/config';

/**
 * Production tip: set CACHE_STORE=redis when REDIS_URL is available.
 * Wrap hot read paths with Cache.remember() — see docs/guide/performance.md.
 */
export default {
  default: env('CACHE_STORE', 'file'),
  prefix: 'pondoknusa',
  connections: {
    file: {
      driver: 'file',
      path: 'storage/framework/cache',
    },
    array: { driver: 'array' },
  },
} satisfies CacheConfig;
