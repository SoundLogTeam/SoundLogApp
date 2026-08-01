import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { flushPendingMomentActions } from '@/utils/momentLogSync';

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

function seedPendingCreateAction(ownerUserId: string | undefined) {
  useMomentLogStore.setState({
    logs: [
      {
        createdAt: new Date().toISOString(),
        id: 'moment-1',
        moodTags: [],
        // Real callers (addLog + queueCreate) stamp the log and its
        // pending action with the same ownerUserId in the same beat — mirror
        // that here so the now-synchronous auth-driven reconciliation (see
        // momentLogStore.ts's useAuthStore.subscribe) treats them consistently.
        ownerUserId,
        source: 'camera',
        syncStatus: 'pending',
      } as never,
    ],
    pendingActions: [
      {
        id: 'create:moment-1',
        momentLogId: 'moment-1',
        ownerUserId,
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
  useAuthStore.setState({
    accessToken: undefined,
    refreshToken: undefined,
    status: 'unauthenticated',
    user: undefined,
  });
});

describe('flushPendingMomentActions account gating (P0-3)', () => {
  it('resumes sync when the re-logged-in account matches the draft owner', async () => {
    seedPendingCreateAction(OWNER_A);
    seedAuthenticatedAs(OWNER_A);

    const { momentLogApi } = await import('@/api/momentLogApi');
    const result = await flushPendingMomentActions();

    expect(result.successCount).toBe(1);
    expect(momentLogApi.createMomentLog).toHaveBeenCalledTimes(1);
  });

  it('quarantines the draft when a different account is logged in (no upload)', async () => {
    seedPendingCreateAction(OWNER_A);
    seedAuthenticatedAs(OWNER_B);

    const { momentLogApi } = await import('@/api/momentLogApi');
    const result = await flushPendingMomentActions();

    expect(momentLogApi.createMomentLog).not.toHaveBeenCalled();
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    // The account-change subscription already moved it out of the visible
    // array before flush ever ran...
    expect(useMomentLogStore.getState().pendingActions).toHaveLength(0);
    // ...but it's queued, untouched, in quarantine for whenever its owner
    // logs back in.
    expect(useMomentLogStore.getState().quarantinedPendingActions).toHaveLength(
      1,
    );
  });

  it('quarantines legacy actions with an unknown owner (undefined ownerUserId)', async () => {
    seedPendingCreateAction(undefined);
    seedAuthenticatedAs(OWNER_A);

    const { momentLogApi } = await import('@/api/momentLogApi');
    const result = await flushPendingMomentActions();

    expect(momentLogApi.createMomentLog).not.toHaveBeenCalled();
    expect(result.successCount).toBe(0);
    expect(useMomentLogStore.getState().pendingActions).toHaveLength(0);
    expect(useMomentLogStore.getState().quarantinedPendingActions).toHaveLength(
      1,
    );
  });
});
