import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  appendRoutePoint: (point: RoutePoint) => void;
  clearLocation: () => void;
  endSession: () => void;
  resetSession: () => void;
  setLocation: (location: GeoPoint) => void;
  setPlace: (place?: PlaceContext) => void;
  setLocationStatus: (status: HomeLocationStatus) => void;
  setMode: (mode: TravelMode) => void;
  setRecommendationMode: (mode: MusicRecommendationMode) => void;
  setSessionRecapId: (recapId?: string) => void;
  startSession: (session?: Partial<Pick<TravelSession, 'id' | 'routePoints' | 'startedAt'>>) => void;
};

const idleSession: TravelSession = {
  id: 'local-session',
  routePoints: [],
  status: 'idle',
};

const MAX_ROUTE_POINTS = 500;

export const useTravelSessionStore = create<TravelSessionState>()(
  persist(
    (set, get) => ({
      session: idleSession,
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
            id: session?.id ?? `session-${Date.now()}`,
            routePoints: session?.routePoints ?? [],
            startedAt: session?.startedAt ?? new Date().toISOString(),
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
          session: {
            ...idleSession,
            ...persistedSession,
            routePoints: persistedSession?.routePoints ?? [],
          },
        };
      },
      name: 'soundlog-travel-session',
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        currentPlace: state.currentPlace,
        locationUpdatedAt: state.locationUpdatedAt,
        recommendationMode: state.recommendationMode,
        selectedMode: state.selectedMode,
        session: state.session,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
