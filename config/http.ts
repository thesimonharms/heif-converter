import type { HttpConfig } from '@pondoknusa/core';

export default {
  trustedProxies: ['127.0.0.1', '::1'],
  securityHeaders: true,
  throttle: {
    enabled: false,
    limit: 300,
    windowMs: 60_000,
    limits: {
      api: { limit: 300, windowMs: 60_000 },
    },
  },
} satisfies HttpConfig;
