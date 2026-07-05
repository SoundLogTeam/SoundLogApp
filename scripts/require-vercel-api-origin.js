#!/usr/bin/env node

const apiOrigin = process.env.SOUNDLOG_API_ORIGIN?.replace(/\/+$/, '');
const staleOrigins = new Set([
  'http://52.79.185.121:4000',
  'https://api.soundlog.shop',
]);

if (!apiOrigin) {
  console.error(
    'SOUNDLOG_API_ORIGIN is required for Vercel builds. Set it to the current SoundLogServer origin, for example http://<EC2_HOST>:4000.',
  );
  process.exit(1);
}

if (!/^https?:\/\//.test(apiOrigin)) {
  console.error('SOUNDLOG_API_ORIGIN must start with http:// or https://.');
  process.exit(1);
}

if (staleOrigins.has(apiOrigin)) {
  console.error(
    `${apiOrigin} is a stale SoundLog API origin. Set SOUNDLOG_API_ORIGIN to the current SoundLogServer origin.`,
  );
  process.exit(1);
}
