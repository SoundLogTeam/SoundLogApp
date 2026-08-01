import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { flushPendingMomentActions } from '@/utils/momentLogSync';

// Same mocks as momentLogSync.test.ts — createMomentLog / createRecap should
// only ever be reached once a draft has been un-quarantined for its owner.
vi.mock('@/api/momentLogApi', () => ({
  momentLogApi: {
    createMomentLog: vi.fn(async () => ({
      createdAt: new Date().toISOString(),
      id: 'server-moment-1',
      moodTags: [],
      source: 'camera',
      syncStatus: 'synced',
    })),
  },
}));

vi.mock('@/api/recapApi', () => ({
  recapApi: {
    createRecap: vi.fn(async () => ({ id: 'recap-1' })),
  },
}));

const OWNER_A = 'user-a';
const OWNER_B = 'user-b';

function seedOwnedDraft() {
  useMomentLogStore.setState({
    logs: [
      {
        createdAt: new Date().toISOString(),
        id: 'moment-1',
        moodTags: [],
        // `ownerUserId` isn't part of the public MomentLog type (see
        // momentLogStore's internal OwnedMomentLog intersection), but the
        // store stamps it onto every persisted entry — mirror that shape
        // here rather than going through `addLog`, to keep this test
        // focused on `reconcileOwnership` alone.
        ownerUserId: OWNER_A,
        source: 'camera',
        syncStatus: 'pending',
      } as never,
    ],
    pendingActions: [
      {
        id: 'create:moment-1',
        momentLogId: 'moment-1',
        ownerUserId: OWNER_A,
        payload: { createdAt: new Date().toISOString(), moodTags: [] },
        queuedAt: new Date().toISOString(),
        type: 'create',
      },
    ],
    quarantinedLogs: [],
    quarantinedPendingActions: [],
  });
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
  useMomentLogStore.setState({
    logs: [],
    pendingActions: [],
    quarantinedLogs: [],
    quarantinedPendingActions: [],
  });
});

describe('reconcileOwnership (display-level account isolation)', () => {
  it('quarantines a draft out of `logs`/`pendingActions` when a different account logs in, without deleting it', () => {
    seedOwnedDraft();

    useMomentLogStore.getState().reconcileOwnership(OWNER_B);

    const state = useMomentLogStore.getState();

    // Hidden from every screen that reads `logs`.
    expect(state.logs).toHaveLength(0);
    expect(state.pendingActions).toHaveLength(0);
    // Not deleted — preserved in the quarantine arrays.
    expect(state.quarantinedLogs).toHaveLength(1);
    expect(state.quarantinedLogs[0].id).toBe('moment-1');
    expect(state.quarantinedPendingActions).toHaveLength(1);
  });

  it('quarantines unknown-owner (legacy/guest) data the same way', () => {
    useMomentLogStore.setState({
      logs: [
        {
          createdAt: new Date().toISOString(),
          id: 'legacy-moment',
          moodTags: [],
          source: 'camera',
          syncStatus: 'local',
        },
      ],
      pendingActions: [],
      quarantinedLogs: [],
      quarantinedPendingActions: [],
    });

    useMomentLogStore.getState().reconcileOwnership(OWNER_A);

    const state = useMomentLogStore.getState();

    expect(state.logs).toHaveLength(0);
    expect(state.quarantinedLogs).toHaveLength(1);
    expect(state.quarantinedLogs[0].id).toBe('legacy-moment');
  });

  it('restores a quarantined draft to `logs`/`pendingActions` when its owner logs back in, and resumes sync', async () => {
    seedOwnedDraft();
    useMomentLogStore.getState().reconcileOwnership(OWNER_B); // quarantine under a different account
    expect(useMomentLogStore.getState().logs).toHaveLength(0);

    // The original owner logs back in.
    useMomentLogStore.getState().reconcileOwnership(OWNER_A);

    const restored = useMomentLogStore.getState();

    expect(restored.logs).toHaveLength(1);
    expect(restored.pendingActions).toHaveLength(1);
    expect(restored.quarantinedLogs).toHaveLength(0);
    expect(restored.quarantinedPendingActions).toHaveLength(0);

    // Sync resumes now that the action is visible and owner-matched again.
    seedAuthenticatedAs(OWNER_A);

    const { momentLogApi } = await import('@/api/momentLogApi');
    const result = await flushPendingMomentActions();

    expect(momentLogApi.createMomentLog).toHaveBeenCalledTimes(1);
    expect(result.successCount).toBe(1);
  });
});

describe('reconciliation timing (no stale-account render frame)', () => {
  it('quarantines the previous account draft synchronously inside the same account-switch call, before any await/microtask', () => {
    // Owner A is logged in with a visible draft (mirrors normal app usage:
    // the log and its pending action already sit in the visible arrays).
    seedOwnedDraft();
    useAuthStore.setState({
      accessToken: 'access-a',
      isHydrated: true,
      refreshToken: 'refresh-a',
      status: 'authenticated',
      user: { displayName: 'A', id: OWNER_A, provider: 'email' },
    });
    expect(useMomentLogStore.getState().logs).toHaveLength(1);

    // Account B logs in — e.g. the exact `set()` finishLogin performs.
    // This is the single synchronous statement a screen's render would
    // race against; there is no `await`, `setTimeout`, or `Promise.resolve()`
    // between it and the assertions below.
    useAuthStore.setState({
      accessToken: 'access-b',
      refreshToken: 'refresh-b',
      status: 'authenticated',
      user: { displayName: 'B', id: OWNER_B, provider: 'email' },
    });

    // If reconciliation depended on a React effect (which only runs after
    // commit), this would still show account A's draft here. Because
    // momentLogStore subscribes to useAuthStore directly, reconciliation
    // already ran synchronously inside the `setState` call above — so by
    // the time ANY screen's render reads `logs`, it's already account B's
    // (empty) view.
    const state = useMomentLogStore.getState();

    expect(state.logs).toHaveLength(0);
    expect(state.pendingActions).toHaveLength(0);
    expect(state.quarantinedLogs).toHaveLength(1);
    expect(state.quarantinedLogs[0].id).toBe('moment-1');
    expect(state.quarantinedPendingActions).toHaveLength(1);
  });
});
