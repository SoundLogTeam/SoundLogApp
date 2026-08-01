import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/store/authStore';
import type { GeoPoint, RecapTemplateId, RoutePoint } from '@/types/domain';

export type PendingTravelLogFinalization = {
  endedAt: string;
  id: string;
  location?: GeoPoint;
  // Account that owned the session when finalization was queued. `undefined`
  // means unknown owner (legacy data) and must stay quarantined by sync
  // gating rather than be treated as belonging to whoever is logged in now.
  ownerUserId?: string;
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
                ownerUserId: useAuthStore.getState().user?.id,
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
      // v1 introduces `ownerUserId`; pre-v1 entries simply lack it, which is
      // the intended "unknown owner" quarantined state (see momentLogStore).
      migrate: (persistedState) => persistedState as TravelLogSyncState,
      name: 'soundlog-travel-log-finalizations',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
