import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
import { flushPendingTravelLogFinalizations } from '@/utils/travelLogSync';

vi.mock('@/api/travelSessionApi', () => ({
  travelSessionApi: {
    endTravelSession: vi.fn(async () => undefined),
  },
}));

vi.mock('@/api/recapApi', () => ({
  recapApi: {
    createRecap: vi.fn(async () => ({ id: 'recap-1' })),
  },
}));

const OWNER_A = 'user-a';
const CURRENT_SESSION = 'session-current';
const OTHER_SESSION = 'session-other';

function seedFinalization() {
  useTravelLogSyncStore.setState({
    pendingFinalizations: [
      {
        endedAt: new Date().toISOString(),
        id: `travel-log:${CURRENT_SESSION}`,
        ownerUserId: OWNER_A,
        queuedAt: new Date().toISOString(),
        routePoints: [],
        sessionId: CURRENT_SESSION,
        templateId: 'film',
        title: 'Trip',
      },
    ],
  });
}

function seedSyncedSessionLog() {
  useMomentLogStore.setState((state) => ({
    logs: [
      ...state.logs,
      {
        createdAt: new Date().toISOString(),
        id: 'log-current-session',
        moodTags: [],
        sessionId: CURRENT_SESSION,
        source: 'camera',
        syncStatus: 'synced',
      },
    ],
  }));
}

function seedAuthenticatedAs(userId: string) {
  useAuthStore.setState({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    status: 'authenticated',
    user: { displayName: 'Test', id: userId, provider: 'email' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useMomentLogStore.setState({ logs: [], pendingActions: [] });
  useTravelLogSyncStore.setState({ pendingFinalizations: [] });
  seedAuthenticatedAs(OWNER_A);
  seedFinalization();
  seedSyncedSessionLog();
});

describe('flushPendingTravelLogFinalizations session-scoped gate (P1-3)', () => {
  it('confirms the Log when the only pending action belongs to a different session', async () => {
    useMomentLogStore.setState((state) => ({
      logs: [
        ...state.logs,
        {
          createdAt: new Date().toISOString(),
          id: 'log-other-session',
          moodTags: [],
          sessionId: OTHER_SESSION,
          source: 'camera',
          syncStatus: 'pending',
        },
      ],
      pendingActions: [
        {
          id: 'create:log-other-session',
          momentLogId: 'log-other-session',
          ownerUserId: OWNER_A,
          payload: { createdAt: new Date().toISOString(), moodTags: [] },
          queuedAt: new Date().toISOString(),
          type: 'create',
        },
      ],
    }));

    const { recapApi } = await import('@/api/recapApi');
    const result = await flushPendingTravelLogFinalizations();

    expect(result.successCount).toBe(1);
    expect(result.deferredCount).toBe(0);
    expect(recapApi.createRecap).toHaveBeenCalledTimes(1);
    expect(useTravelLogSyncStore.getState().pendingFinalizations).toHaveLength(
      0,
    );
  });

  it('defers the Log while a pending action for its own session is unresolved', async () => {
    // The log itself already reports `synced` (e.g. its create succeeded),
    // but a follow-up edit for the same session is still queued. This is
    // exactly the case the old global `pendingActions.length > 0` check and
    // the syncStatus-based session check could each miss on their own.
    useMomentLogStore.setState((state) => ({
      logs: state.logs,
      pendingActions: [
        {
          id: 'edit:log-current-session',
          momentLogId: 'log-current-session',
          ownerUserId: OWNER_A,
          payload: { moodTags: [], note: null, placeName: null },
          queuedAt: new Date().toISOString(),
          type: 'edit',
        },
      ],
    }));

    const { recapApi } = await import('@/api/recapApi');
    const result = await flushPendingTravelLogFinalizations();

    expect(result.deferredCount).toBe(1);
    expect(result.successCount).toBe(0);
    expect(recapApi.createRecap).not.toHaveBeenCalled();
    expect(useTravelLogSyncStore.getState().pendingFinalizations).toHaveLength(
      1,
    );
  });
});
