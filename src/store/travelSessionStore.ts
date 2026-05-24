import { create } from 'zustand';

import { GeoPoint, TravelMode } from '@/types/domain';

type TravelSession = {
  endedAt?: string;
  id: string;
  startedAt?: string;
  status: 'idle' | 'active' | 'ended';
};

type TravelSessionState = {
  currentLocation?: GeoPoint;
  selectedMode?: TravelMode;
  session: TravelSession;
  setLocation: (location: GeoPoint) => void;
  setMode: (mode: TravelMode) => void;
  startSession: () => void;
};

export const useTravelSessionStore = create<TravelSessionState>((set) => ({
  session: {
    id: 'local-session',
    status: 'idle',
  },
  setLocation: (currentLocation) => set({ currentLocation }),
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
