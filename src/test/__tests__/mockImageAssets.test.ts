import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMockImageUrl } from '@/mocks/imageAssets';

describe('getMockImageUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the API origin for public regional assets', () => {
    vi.stubEnv(
      'EXPO_PUBLIC_SOUNDLOG_API_BASE_URL',
      'https://soundlog.example.com/api/soundlog',
    );

    expect(getMockImageUrl('busan')).toBe(
      'https://soundlog.example.com/assets/playlists/busan.webp',
    );
  });

  it('lets the UI render a semantic fallback when no API origin exists', () => {
    vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', '');

    expect(getMockImageUrl('seoul')).toBeUndefined();
  });
});
