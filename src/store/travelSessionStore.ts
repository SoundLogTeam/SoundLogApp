import { create } from 'zustand';

import { GeoPoint, PlaceContext, TravelMode } from '@/types/domain';

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
  selectedMode?: TravelMode;
  session: TravelSession;
  clearLocation: () => void;
  setLocation: (location: GeoPoint) => void;
  setPlace: (place?: PlaceContext) => void;
  setLocationStatus: (status: HomeLocationStatus) => void;
  setMode: (mode: TravelMode) => void;
  startSession: () => void;
};

export const useTravelSessionStore = create<TravelSessionState>((set) => ({
  session: {
    id: 'local-session',
    status: 'idle',
  },
  locationStatus: 'idle',
  clearLocation: () =>
    set({
      currentLocation: undefined,
      currentPlace: undefined,
      locationStatus: 'idle',
      locationUpdatedAt: undefined,
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
  startSession: () =>
    set({
      session: {
        id: `session-${Date.now()}`,
        startedAt: new Date().toISOString(),
        status: 'active',
      },
    }),
}));
