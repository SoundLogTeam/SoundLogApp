import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestApi } from '@/api/client';
import { queryClient } from '@/providers/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { useRecommendationCacheStore } from '@/store/recommendationCacheStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
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

function seedUnsyncedDraftState() {
  useMomentLogStore.setState({
    logs: [
      {
        createdAt: new Date().toISOString(),
        id: 'moment-1',
        moodTags: [],
        // Mirrors real addLog/queueCreate behavior: the log and its pending
        // action are stamped with the same ownerUserId at creation time.
        ownerUserId: 'user-a',
        source: 'camera',
        syncStatus: 'pending',
      } as never,
    ],
    pendingActions: [
      {
        id: 'create:moment-1',
        momentLogId: 'moment-1',
        ownerUserId: 'user-a',
        payload: { createdAt: new Date().toISOString(), moodTags: [] },
        queuedAt: new Date().toISOString(),
        type: 'create',
      },
    ],
    quarantinedLogs: [],
    quarantinedPendingActions: [],
  });

  useTravelLogSyncStore.setState({
    pendingFinalizations: [
      {
        endedAt: new Date().toISOString(),
        id: 'travel-log:session-1',
        ownerUserId: 'user-a',
        queuedAt: new Date().toISOString(),
        routePoints: [],
        sessionId: 'session-1',
        templateId: 'film',
        title: 'Test trip',
      },
    ],
  });

  useTravelSessionStore.setState({
    quarantinedSessions: [],
    session: {
      id: 'session-1',
      // Mirrors real startSession behavior: stamped with the account that
      // was authenticated when the session began.
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
  seedUnsyncedDraftState();
  seedServerDerivedCaches();
});

describe('clearAuthSession (P0-3: refresh-failure path)', () => {
  it('resets only auth state and preserves unsynced drafts / active session', () => {
    clearAuthSession();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().accessToken).toBeUndefined();
    expect(useAuthStore.getState().refreshToken).toBeUndefined();
    expect(useAuthStore.getState().user).toBeUndefined();

    // Preserved, but no longer "current account" -- logoutLocal() flips the
    // authenticated user to undefined, which synchronously reconciles the
    // draft out of the visible arrays (see momentLogStore.ts's
    // useAuthStore.subscribe). Nothing is deleted: it lands in quarantine
    // and comes straight back once the SAME account re-authenticates.
    expect(useMomentLogStore.getState().pendingActions).toHaveLength(0);
    expect(useMomentLogStore.getState().logs).toHaveLength(0);
    expect(useMomentLogStore.getState().quarantinedPendingActions).toHaveLength(
      1,
    );
    expect(useMomentLogStore.getState().quarantinedLogs).toHaveLength(1);
    // Preserved: pending travel Log finalization.
    expect(useTravelLogSyncStore.getState().pendingFinalizations).toHaveLength(
      1,
    );
    // Preserved travel session: also immediately quarantined (invisible)
    // rather than deleted, same as the moment log draft above.
    expect(useTravelSessionStore.getState().session.status).toBe('idle');
    expect(useTravelSessionStore.getState().quarantinedSessions).toHaveLength(
      1,
    );
    expect(
      useTravelSessionStore.getState().quarantinedSessions[0].routePoints,
    ).toHaveLength(1);
  });

  it('wipes server-derived caches (library, profile, recommendation cache, query cache)', () => {
    clearAuthSession();

    expect(useLibraryStore.getState().likedTracks).toHaveLength(0);
    expect(useLibraryStore.getState().seededPlaylistIds).toHaveLength(0);
    expect(useUserProfileStore.getState().profile.completedOnboarding).toBe(
      false,
    );
    expect(
      useRecommendationCacheStore.getState().featuredPlaylists,
    ).toEqual({});
    expect(queryClient.getQueryData(['probe-query'])).toBeUndefined();
  });
});

describe('clearAccountSession (explicit logout / account deletion)', () => {
  it('wipes auth state and all local drafts', () => {
    clearAccountSession();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useMomentLogStore.getState().pendingActions).toHaveLength(0);
    expect(useMomentLogStore.getState().logs).toHaveLength(0);
    // Explicit account deletion/logout wipes quarantine too -- unlike the
    // refresh-failure path, this is user-initiated and intentionally final.
    expect(useMomentLogStore.getState().quarantinedPendingActions).toHaveLength(
      0,
    );
    expect(useMomentLogStore.getState().quarantinedLogs).toHaveLength(0);
    expect(useTravelLogSyncStore.getState().pendingFinalizations).toHaveLength(
      0,
    );
    expect(useTravelSessionStore.getState().session.status).toBe('idle');
    expect(useTravelSessionStore.getState().session.routePoints).toHaveLength(
      0,
    );
    expect(useTravelSessionStore.getState().quarantinedSessions).toHaveLength(
      0,
    );
  });
});

describe('client.ts token refresh failure', () => {
  it('preserves pendingActions and drops only auth state on a failed refresh', async () => {
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

    // Auth state cleared (forces re-login)...
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    // ...and the draft is immediately out of the visible arrays (no
    // account is "current" to own it right now)...
    expect(useMomentLogStore.getState().pendingActions).toHaveLength(0);
    expect(useMomentLogStore.getState().logs).toHaveLength(0);
    // ...but it survives, quarantined, ready to come back for its owner.
    expect(useMomentLogStore.getState().quarantinedPendingActions).toHaveLength(
      1,
    );
    expect(useMomentLogStore.getState().quarantinedLogs).toHaveLength(1);
  });
});
