import { create } from 'zustand';

import { GeoPoint, TravelMode } from '@/types/domain';

export type HomeLocationStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';

type TravelSession = {
  endedAt?: string;
  id: string;
  startedAt?: string;
  status: 'idle' | 'active' | 'ended';
};

type TravelSessionState = {
  currentLocation?: GeoPoint;
  locationStatus: HomeLocationStatus;
  locationUpdatedAt?: string;
  selectedMode?: TravelMode;
  session: TravelSession;
  clearLocation: () => void;
  setLocation: (location: GeoPoint) => void;
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
  startSession: () =>
    set({
      session: {
        id: `session-${Date.now()}`,
        startedAt: new Date().toISOString(),
        status: 'active',
      },
    }),
}));
