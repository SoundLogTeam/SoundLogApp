import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  GeoPoint,
  MusicRecommendationMode,
  PlaceContext,
  TravelMode,
} from '@/types/domain';

export type HomeLocationStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';

type TravelSession = {
  endedAt?: string;
  id: string;
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
  clearLocation: () => void;
  endSession: () => void;
  resetSession: () => void;
  setLocation: (location: GeoPoint) => void;
  setPlace: (place?: PlaceContext) => void;
  setLocationStatus: (status: HomeLocationStatus) => void;
  setMode: (mode: TravelMode) => void;
  setRecommendationMode: (mode: MusicRecommendationMode) => void;
  startSession: () => void;
};

const idleSession: TravelSession = {
  id: 'local-session',
  status: 'idle',
};

export const useTravelSessionStore = create<TravelSessionState>()(
  persist(
    (set, get) => ({
      session: idleSession,
      locationStatus: 'idle',
      recommendationMode: 'everyday',
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
      startSession: () =>
        set({
          session: {
            id: `session-${Date.now()}`,
            startedAt: new Date().toISOString(),
            status: 'active',
          },
        }),
    }),
    {
      name: 'soundlog-travel-session',
      partialize: (state) => ({
        recommendationMode: state.recommendationMode,
        selectedMode: state.selectedMode,
        session: state.session,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
