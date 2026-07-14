import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GeoPoint, RecapTemplateId, RoutePoint } from '@/types/domain';

export type PendingTravelLogFinalization = {
  endedAt: string;
  id: string;
  location?: GeoPoint;
  queuedAt: string;
  routePoints: RoutePoint[];
  sessionId: string;
  templateId: RecapTemplateId;
  title: string;
};

type TravelLogSyncState = {
  pendingFinalizations: PendingTravelLogFinalization[];
  queueFinalization: (
    input: Omit<PendingTravelLogFinalization, 'id' | 'queuedAt'>,
  ) => void;
  removeFinalization: (id: string) => void;
};

function getFinalizationId(sessionId: string) {
  return `travel-log:${sessionId}`;
}

export const useTravelLogSyncStore = create<TravelLogSyncState>()(
  persist(
    (set) => ({
      pendingFinalizations: [],
      queueFinalization: (input) =>
        set((state) => {
          const id = getFinalizationId(input.sessionId);

          return {
            pendingFinalizations: [
              ...state.pendingFinalizations.filter((item) => item.id !== id),
              {
                ...input,
                id,
                queuedAt: new Date().toISOString(),
              },
            ],
          };
        }),
      removeFinalization: (id) =>
        set((state) => ({
          pendingFinalizations: state.pendingFinalizations.filter(
            (item) => item.id !== id,
          ),
        })),
    }),
    {
      name: 'soundlog-travel-log-finalizations',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
