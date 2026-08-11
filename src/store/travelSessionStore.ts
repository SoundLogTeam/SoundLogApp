import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/store/authStore';
import {
  GeoPoint,
  MusicRecommendationMode,
  PlaceContext,
  RoutePoint,
  TravelMode,
} from '@/types/domain';

export type HomeLocationStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';

type TravelSession = {
  endedAt?: string;
  id: string;
  // Account that owned the device when this session was started. Used to
  // keep an active travel sensor buffer isolated by account. `undefined`
  // means unknown owner (data
  // persisted before this field existed) and is treated like a mismatch:
  // quarantined, never auto-deleted, never shown to whoever is logged in.
  ownerUserId?: string;
  recapId?: string;
  routePoints: RoutePoint[];
  startedAt?: string;
  status: 'idle' | 'active' | 'ended';
};

type TravelSessionState = {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  locationStatus: HomeLocationStatus;
  locationUpdatedAt?: string;
  recommendationMode: MusicRecommendationMode;
  selectedMode?: TravelMode;
  session: TravelSession;
  // Sessions preserved (never auto-deleted — they may hold unsynced
  // routePoints) but hidden from every screen that reads `session` because
  // they belong to a different (or unknown) account than whoever is
  // currently logged in. Restored by `reconcileOwnership` once the
  // matching account re-authenticates.
  quarantinedSessions: TravelSession[];
  appendRoutePoint: (point: RoutePoint) => void;
  clearLocation: () => void;
  endSession: () => void;
  // Re-partitions `session` vs. `quarantinedSessions` based on which
  // account currently owns the device session. Call this whenever the
  // authenticated account changes (login, logout, refresh failure) — see
  // the useAuthStore.subscribe registration at the bottom of this file.
  reconcileOwnership: (currentUserId?: string) => void;
  resetSession: () => void;
  setLocation: (location: GeoPoint) => void;
  setPlace: (place?: PlaceContext) => void;
  setLocationStatus: (status: HomeLocationStatus) => void;
  setMode: (mode: TravelMode) => void;
  setRecommendationMode: (mode: MusicRecommendationMode) => void;
  setSessionRecapId: (recapId?: string) => void;
  startSession: (
    session: Pick<TravelSession, 'id'> & Partial<Pick<TravelSession, 'routePoints' | 'startedAt'>>,
  ) => void;
};

const idleSession: TravelSession = {
  id: 'idle',
  routePoints: [],
  status: 'idle',
};

const MAX_ROUTE_POINTS = 500;

export const useTravelSessionStore = create<TravelSessionState>()(
  persist(
    (set, get) => ({
      session: idleSession,
      quarantinedSessions: [],
      locationStatus: 'idle',
      recommendationMode: 'everyday',
      appendRoutePoint: (point) =>
        set((state) => {
          if (state.session.status !== 'active') {
            return {};
          }

          const routePoints = state.session.routePoints ?? [];
          const lastPoint = routePoints.at(-1);

          if (
            lastPoint &&
            lastPoint.lat === point.lat &&
            lastPoint.lng === point.lng &&
            lastPoint.recordedAt === point.recordedAt
          ) {
            return {};
          }

          return {
            session: {
              ...state.session,
              routePoints: [...routePoints, point].slice(-MAX_ROUTE_POINTS),
            },
          };
        }),
      clearLocation: () =>
        set({
          currentLocation: undefined,
          currentPlace: undefined,
          locationStatus: 'idle',
          locationUpdatedAt: undefined,
        }),
      endSession: () => {
        const currentSession = get().session;

        if (currentSession.status !== 'active') {
          return;
        }

        set({
          session: {
            ...currentSession,
            endedAt: new Date().toISOString(),
            status: 'ended',
          },
        });
      },
      reconcileOwnership: (currentUserId) =>
        set((state) => {
          const pool: TravelSession[] = [
            ...(state.session.status !== 'idle' ? [state.session] : []),
            ...state.quarantinedSessions,
          ];

          if (pool.length === 0) {
            return state;
          }

          const seenIds = new Set<string>();
          const deduped = pool.filter((session) => {
            if (seenIds.has(session.id)) {
              return false;
            }
            seenIds.add(session.id);
            return true;
          });

          const owned = deduped.find(
            (session) => currentUserId && session.ownerUserId === currentUserId,
          );
          const hidden = deduped.filter((session) => session !== owned);

          return {
            session: owned ?? idleSession,
            quarantinedSessions: hidden,
          };
        }),
      resetSession: () =>
        set({
          session: idleSession,
        }),
      setLocation: (currentLocation) =>
        set({
          currentLocation,
          locationStatus: 'granted',
          locationUpdatedAt: new Date().toISOString(),
        }),
      setLocationStatus: (locationStatus) => set({ locationStatus }),
      setMode: (selectedMode) => set({ selectedMode }),
      setPlace: (currentPlace) => set({ currentPlace }),
      setRecommendationMode: (recommendationMode) => set({ recommendationMode }),
      setSessionRecapId: (recapId) =>
        set((state) => ({
          session: {
            ...state.session,
            recapId,
          },
        })),
      startSession: (session) =>
        set({
          session: {
            id: session.id,
            ownerUserId: useAuthStore.getState().user?.id,
            routePoints: session.routePoints ?? [],
            startedAt: session.startedAt ?? new Date().toISOString(),
            status: 'active',
          },
        }),
    }),
    {
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<TravelSessionState> | undefined;
        const persistedSession = persisted?.session;

        return {
          ...currentState,
          ...persisted,
          quarantinedSessions: persisted?.quarantinedSessions ?? [],
          session: {
            ...idleSession,
            ...persistedSession,
            routePoints: persistedSession?.routePoints ?? [],
          },
        };
      },
      name: 'soundlog-travel-session',
      // Fires once this store's own persisted session/quarantinedSessions
      // have loaded. Needed alongside the useAuthStore.subscribe below for
      // Auth can finish hydrating and fire its subscription before this store's own
      // async storage read resolves, so reconciliation must also re-run
      // once real persisted data is in place.
      onRehydrateStorage: () => () => {
        reconcileTravelSessionOwnershipWithCurrentAuth();
      },
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        currentPlace: state.currentPlace,
        locationUpdatedAt: state.locationUpdatedAt,
        quarantinedSessions: state.quarantinedSessions,
        recommendationMode: state.recommendationMode,
        selectedMode: state.selectedMode,
        session: state.session,
      }),
      storage: createJSONStorage(() => AsyncStorage),
      // v1 introduces `ownerUserId` on TravelSession and the
      // `quarantinedSessions` array. Pre-v1 persisted sessions simply lack
      // `ownerUserId` — reconcileOwnership treats that exactly like an
      // owner mismatch (quarantined, never auto-restored, never
      // auto-deleted) rather than auto-adopting it for whoever logs in.
      version: 1,
    },
  ),
);

// --- Cross-account display isolation ------
//
// useAuthStore notifies subscribers
// synchronously inside the very `set()` call that logs an account in/out,
// so this reconciliation always finishes before React renders any screen
// that reads `session` — no one-frame exposure of a stale account's
// travel session.
let lastReconciledTravelSessionOwnerUserId: string | undefined;
let hasReconciledTravelSessionSinceHydration = false;

function reconcileTravelSessionOwnershipWithCurrentAuth() {
  const authState = useAuthStore.getState();

  if (!authState.isHydrated) {
    return;
  }

  const ownerUserId = authState.user?.id;

  if (
    hasReconciledTravelSessionSinceHydration &&
    ownerUserId === lastReconciledTravelSessionOwnerUserId
  ) {
    return;
  }

  hasReconciledTravelSessionSinceHydration = true;
  lastReconciledTravelSessionOwnerUserId = ownerUserId;
  useTravelSessionStore.getState().reconcileOwnership(ownerUserId);
}

useAuthStore.subscribe(() => {
  reconcileTravelSessionOwnershipWithCurrentAuth();
});
