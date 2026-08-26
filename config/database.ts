import { env, envBool, s } from '@pondoknusa/config';

export const schema = s.object({
  default: s.string({ required: true, minLength: 1 }),
  connections: s.object({
    sqlite: s.object({
      driver: s.string({ enum: ['sqlite'] }),
      database: s.string({ required: true, minLength: 1 }),
      journalMode: s.string({
        enum: ['wal', 'delete', 'truncate', 'persist', 'memory', 'off'],
        required: false,
      }),
    }),
  }),
});

export default {
  default: env('DB_CONNECTION', 'sqlite'),
  poolWarmup: envBool('DB_POOL_WARMUP', env('NODE_ENV', 'development') === 'production'),
  connections: {
    sqlite: {
      driver: 'sqlite',
      database: env('DB_DATABASE', 'database/database.sqlite'),
      journalMode: 'wal',
    },
  },
} as const;
