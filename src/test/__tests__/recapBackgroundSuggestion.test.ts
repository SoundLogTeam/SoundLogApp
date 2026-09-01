import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recapApi } from '@/api/recapApi';
import { useAuthStore } from '@/store/authStore';

function seedAuthenticated() {
  useAuthStore.setState({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    status: 'authenticated',
    user: { displayName: 'Test', id: 'user-a', provider: 'email' },
  } as never);
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL = 'https://api.test.local';
  useAuthStore.setState({
    accessToken: undefined,
    refreshToken: undefined,
    status: 'unauthenticated',
    user: undefined,
  } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('recapApi.getBackgroundSuggestion', () => {
  it('requests a location-based suggestion with the current travel context', async () => {
    seedAuthenticated();

    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      expect(String(input)).toBe(
        'https://api.test.local/v1/recaps/background-suggestion',
      );
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({
        location: { lat: 35.1532, lng: 129.1187 },
        moodTags: ['fresh'],
        travelMode: 'ocean',
      });

      return new Response(
        JSON.stringify({
          data: {
            backgroundImageUrl: 'https://example.com/gwangalli.jpg',
            placeName: '광안리해수욕장',
            placeType: '관광지',
            source: 'poi_image',
          },
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      recapApi.getBackgroundSuggestion({
        location: { lat: 35.1532, lng: 129.1187 },
        moodTags: ['fresh'],
        travelMode: 'ocean',
      }),
    ).resolves.toEqual({
      backgroundImageUrl: 'https://example.com/gwangalli.jpg',
      placeName: '광안리해수욕장',
      placeType: '관광지',
      source: 'poi_image',
    });
  });

  it('does not block recap creation when the suggestion request fails', async () => {
    seedAuthenticated();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { message: 'ML unavailable' } }),
            { status: 503 },
          ),
      ),
    );

    await expect(
      recapApi.getBackgroundSuggestion({
        location: { lat: 35.1532, lng: 129.1187 },
      }),
    ).resolves.toBeUndefined();
  });

  it('skips the request while unauthenticated', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      recapApi.getBackgroundSuggestion({
        location: { lat: 35.1532, lng: 129.1187 },
      }),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('recapApi.createRecap background', () => {
  it('forwards the suggested background while keeping the request idempotent', async () => {
    seedAuthenticated();

    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      const headers = new Headers(init?.headers);

      expect(headers.get('Idempotency-Key')).toBe('standalone-recap:capture-a');
      expect(JSON.parse(String(init?.body))).toMatchObject({
        backgroundImageUrl: 'https://example.com/gwangalli.jpg',
        momentLogIds: ['capture-a'],
      });

      return new Response(
        JSON.stringify({
          data: {
            backgroundImageUrl: 'https://example.com/gwangalli.jpg',
            createdAt: '2026-09-01T00:00:00.000Z',
            id: 'recap-a',
            placeName: '광안리해수욕장',
            representativeTrack: {
              artist: 'Artist',
              id: 'track-a',
              title: 'Track',
            },
            title: '광안리 로그',
          },
        }),
        { status: 201 },
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const recap = await recapApi.createRecap(
      {
        backgroundImageUrl: 'https://example.com/gwangalli.jpg',
        momentLogIds: ['capture-a'],
        templateId: 'film',
        visibility: 'private',
      },
      'standalone-recap:capture-a',
    );

    expect(recap?.backgroundImageUrl).toBe('https://example.com/gwangalli.jpg');
  });
});
