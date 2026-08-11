import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestApi } from '@/api/client';
import { queryClient } from '@/providers/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useRecommendationCacheStore } from '@/store/recommendationCacheStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { clearAccountSession, clearAuthSession } from '@/utils/accountSession';

const AUTHENTICATED_USER = {
  displayName: 'Test User',
  id: 'user-a',
  provider: 'email' as const,
};

function seedAuthenticatedState() {
  useAuthStore.setState({
    accessToken: 'access-old',
    errorMessage: undefined,
    lastLoginProvider: 'email',
    refreshToken: 'refresh-old',
    status: 'authenticated',
    updatedAt: new Date().toISOString(),
    user: AUTHENTICATED_USER,
  });
}

function seedActiveTravelSession() {
  useTravelSessionStore.setState({
    quarantinedSessions: [],
    session: {
      id: 'session-1',
      ownerUserId: 'user-a',
      routePoints: [{ lat: 1, lng: 1, recordedAt: new Date().toISOString() }],
      startedAt: new Date().toISOString(),
      status: 'active',
    },
  });
}

function seedServerDerivedCaches() {
  useLibraryStore.setState({
    likedTracks: [
      {
        createdAt: new Date().toISOString(),
        track: { artist: 'Artist', id: 'track-1', title: 'Song' },
      },
    ],
    savedTracks: [],
    seededPlaylistIds: ['playlist-1'],
  });
  useUserProfileStore.setState({
    profile: {
      completedOnboarding: true,
      locationRecommendationEnabled: true,
      preferredGenres: ['lofi'],
      preferredMoods: [],
      travelStyles: [],
    },
  });
  useRecommendationCacheStore.setState({
    featuredPlaylists: {
      'key-1': { cachedAt: new Date().toISOString(), data: [] },
    },
    moodRecommendations: {},
  });
  queryClient.setQueryData(['probe-query'], { fromPreviousAccount: true });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  seedAuthenticatedState();
  seedActiveTravelSession();
  seedServerDerivedCaches();
});

describe('clearAuthSession', () => {
  it('clears authentication and quarantines the active travel sensor buffer', () => {
    clearAuthSession();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().accessToken).toBeUndefined();
    expect(useAuthStore.getState().refreshToken).toBeUndefined();
    expect(useAuthStore.getState().user).toBeUndefined();
    expect(useTravelSessionStore.getState().session.status).toBe('idle');
    expect(useTravelSessionStore.getState().quarantinedSessions).toHaveLength(1);
    expect(
      useTravelSessionStore.getState().quarantinedSessions[0].routePoints,
    ).toHaveLength(1);
  });

  it('wipes server-derived caches', () => {
    clearAuthSession();

    expect(useLibraryStore.getState().likedTracks).toHaveLength(0);
    expect(useLibraryStore.getState().seededPlaylistIds).toHaveLength(0);
    expect(useUserProfileStore.getState().profile.completedOnboarding).toBe(false);
    expect(useRecommendationCacheStore.getState().featuredPlaylists).toEqual({});
    expect(queryClient.getQueryData(['probe-query'])).toBeUndefined();
  });
});

describe('clearAccountSession', () => {
  it('clears authentication and the active travel sensor buffer', () => {
    clearAccountSession();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useTravelSessionStore.getState().session.status).toBe('idle');
    expect(useTravelSessionStore.getState().session.routePoints).toHaveLength(0);
    expect(useTravelSessionStore.getState().quarantinedSessions).toHaveLength(0);
  });
});

describe('client.ts token refresh failure', () => {
  it('clears authentication and preserves the active travel sensor buffer', async () => {
    process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL = 'https://api.test.local';

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);

      if (url.endsWith('/v1/auth/refresh')) {
        return new Response(JSON.stringify({ error: { message: 'expired' } }), {
          status: 401,
        });
      }

      return new Response(JSON.stringify({ error: { message: 'unauthorized' } }), {
        status: 401,
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(requestApi('/v1/some-resource')).rejects.toMatchObject({
      status: 401,
    });

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useTravelSessionStore.getState().session.status).toBe('idle');
    expect(useTravelSessionStore.getState().quarantinedSessions).toHaveLength(1);
  });
});
