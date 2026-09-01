import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPublicImageUrl } from '@/utils/publicImageAssets';

describe('getPublicImageUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the configured API origin without inheriting its path', () => {
    vi.stubEnv(
      'EXPO_PUBLIC_SOUNDLOG_API_BASE_URL',
      'https://soundlog.example.com/api/soundlog',
    );

    expect(getPublicImageUrl('busan')).toBe(
      'https://soundlog.example.com/assets/playlists/busan.webp',
    );
  });

  it('lets the UI render a semantic fallback when no API origin exists', () => {
    vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', '');

    expect(getPublicImageUrl('seoul')).toBeUndefined();
  });
});
