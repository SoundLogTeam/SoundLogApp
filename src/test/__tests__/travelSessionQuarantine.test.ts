import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/store/authStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';

const OWNER_A = 'user-a';
const OWNER_B = 'user-b';

function seedActiveSessionOwnedBy(ownerUserId: string | undefined) {
  useTravelSessionStore.setState({
    quarantinedSessions: [],
    session: {
      id: 'travel-session-1',
      ownerUserId,
      routePoints: [
        { lat: 37.5, lng: 127.0, recordedAt: new Date().toISOString() },
        { lat: 37.51, lng: 127.01, recordedAt: new Date().toISOString() },
      ],
      startedAt: new Date().toISOString(),
      status: 'active',
    },
  });
}

beforeEach(() => {
  useTravelSessionStore.setState({
    currentLocation: undefined,
    currentPlace: undefined,
    quarantinedSessions: [],
    session: { id: 'local-session', routePoints: [], status: 'idle' },
  });
});

describe('travelSessionStore account isolation (mirrors momentLogStore)', () => {
  it('quarantines the active session and its routePoints out of `session` when a different account logs in, without deleting it', () => {
    seedActiveSessionOwnedBy(OWNER_A);

    useTravelSessionStore.getState().reconcileOwnership(OWNER_B);

    const state = useTravelSessionStore.getState();

    // Hidden from every screen that reads `session` (e.g. app/(tabs)/index.tsx,
    // TravelScreen.tsx) -- account B never sees account A's active trip.
    expect(state.session.status).toBe('idle');
    expect(state.session.routePoints).toHaveLength(0);
    // Not deleted -- preserved, GPS routePoints intact, in quarantine.
    expect(state.quarantinedSessions).toHaveLength(1);
    expect(state.quarantinedSessions[0].id).toBe('travel-session-1');
    expect(state.quarantinedSessions[0].routePoints).toHaveLength(2);
  });

  it('quarantines an unknown-owner (pre-migration) session the same way', () => {
    seedActiveSessionOwnedBy(undefined);

    useTravelSessionStore.getState().reconcileOwnership(OWNER_A);

    const state = useTravelSessionStore.getState();

    expect(state.session.status).toBe('idle');
    expect(state.quarantinedSessions).toHaveLength(1);
    expect(state.quarantinedSessions[0].id).toBe('travel-session-1');
  });

  it('restores the session to `session` when its owner logs back in', () => {
    seedActiveSessionOwnedBy(OWNER_A);
    useTravelSessionStore.getState().reconcileOwnership(OWNER_B); // quarantine under a different account
    expect(useTravelSessionStore.getState().session.status).toBe('idle');

    // The original owner logs back in.
    useTravelSessionStore.getState().reconcileOwnership(OWNER_A);

    const restored = useTravelSessionStore.getState();

    expect(restored.session.id).toBe('travel-session-1');
    expect(restored.session.status).toBe('active');
    expect(restored.session.routePoints).toHaveLength(2);
    expect(restored.quarantinedSessions).toHaveLength(0);
  });

  it('reconciles synchronously inside the same account-switch call (no stale-session render frame)', () => {
    seedActiveSessionOwnedBy(OWNER_A);
    useAuthStore.setState({
      accessToken: 'access-a',
      isHydrated: true,
      refreshToken: 'refresh-a',
      status: 'authenticated',
      user: { displayName: 'A', id: OWNER_A, provider: 'email' },
    });
    expect(useTravelSessionStore.getState().session.status).toBe('active');

    // Account B logs in -- the exact `set()` finishLogin performs. No
    // await/microtask between this and the assertions below.
    useAuthStore.setState({
      accessToken: 'access-b',
      refreshToken: 'refresh-b',
      status: 'authenticated',
      user: { displayName: 'B', id: OWNER_B, provider: 'email' },
    });

    const state = useTravelSessionStore.getState();

    expect(state.session.status).toBe('idle');
    expect(state.quarantinedSessions).toHaveLength(1);
    expect(state.quarantinedSessions[0].id).toBe('travel-session-1');
  });
});
