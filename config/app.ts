import { env, s } from '@pondoknusa/config';

export const schema = s.object({
  name: s.string({ required: true, minLength: 1 }),
  debug: s.boolean(),
  url: s.string({ url: true }),
  locale: s.string({ minLength: 2 }),
  fallback_locale: s.string({ minLength: 2 }),
  faker_locale: s.string({ minLength: 2 }),
});

export default {
  name: env('APP_NAME', 'heif-converter'),
  key: env('APP_KEY', ''),
  debug: env('APP_DEBUG', true),
  url: env('APP_URL', 'http://127.0.0.1:3000'),
  locale: env('APP_LOCALE', 'en'),
  fallback_locale: env('APP_FALLBACK_LOCALE', 'en'),
  faker_locale: env('APP_FAKER_LOCALE', 'en'),
  locales_path: 'lang',
  available_locales: ['en'],
} as const;
