import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/store/authStore';
import {
  GeoPoint,
  MomentLog,
  MoodTag,
  MusicLogItem,
  RecapTemplateId,
  RecapVisibility,
  Track,
  TravelMode,
} from '@/types/domain';

export type MomentLogCreateQueuePayload = {
  createdAt: string;
  location?: GeoPoint;
  moodTags: MoodTag[];
  note?: string;
  photoUri?: string;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  recapVisibility?: RecapVisibility;
  sessionId?: string;
  templateId?: RecapTemplateId;
  track?: Track;
  travelMode?: TravelMode;
};

export type MomentLogEditQueuePayload = {
  moodTags: MoodTag[];
  note: string | null;
  placeName: string | null;
  removePhoto?: boolean;
  replacePhotoUri?: string;
  track?: Track;
};

export type MomentLogPendingAction =
  | {
      id: string;
      momentLogId: string;
      // Account that owned the session when this action was queued. Used to
      // gate sync so a preserved offline draft never uploads under a
      // different account after re-login. `undefined` means the owner is
      // unknown (legacy data persisted before this field existed) and the
      // action must stay quarantined rather than be treated as a match.
      ownerUserId?: string;
      payload: MomentLogCreateQueuePayload;
      queuedAt: string;
      type: 'create';
    }
  | {
      id: string;
      momentLogId: string;
      ownerUserId?: string;
      payload: MomentLogEditQueuePayload;
      queuedAt: string;
      type: 'edit';
    }
  | {
      id: string;
      momentLogId: string;
      ownerUserId?: string;
      queuedAt: string;
      type: 'delete';
    };

// Internal-only shape: every MomentLog kept in `logs` / `quarantinedLogs`
// also carries the account id that owned it when it entered local state.
// Kept as an intersection (rather than editing the shared MomentLog type in
// types/domain.ts) so every other consumer of MomentLog is unaffected — a
// plain MomentLog is still assignable wherever this type is required.
type OwnedMomentLog = MomentLog & { ownerUserId?: string };

type MomentLogState = {
  logs: MomentLog[];
  pendingActions: MomentLogPendingAction[];
  // Drafts / pending actions preserved (never auto-deleted) but hidden from
  // every screen because they belong to an account other than whoever is
  // currently logged in — or to an unknown owner (data persisted before
  // ownership tracking existed). Restored into `logs`/`pendingActions` by
  // `reconcileOwnership` only once the matching account re-authenticates.
  quarantinedLogs: MomentLog[];
  quarantinedPendingActions: MomentLogPendingAction[];
  addLog: (log: MomentLog) => void;
  getRecentLogs: (limit?: number) => MomentLog[];
  mergeServerLogs: (logs: MomentLog[]) => void;
  queueCreate: (
    momentLogId: string,
    payload: MomentLogCreateQueuePayload,
  ) => void;
  queueEdit: (momentLogId: string, payload: MomentLogEditQueuePayload) => void;
  queueDelete: (log: MomentLog) => void;
  // Re-partitions logs/pendingActions vs. their quarantined counterparts
  // based on which account currently owns the session. Call this whenever
  // the authenticated account changes (login, logout, refresh failure) —
  // see MomentLogSyncWorker.tsx.
  reconcileOwnership: (currentUserId?: string) => void;
  removePendingAction: (id: string) => void;
  removeLog: (id: string) => void;
  resolveLocalLog: (localMomentLogId: string, serverLog: MomentLog) => void;
  updateLog: (id: string, patch: Partial<MomentLog>) => void;
};

export function momentLogToMusicLogItem(log: MomentLog): MusicLogItem {
  return {
    artistName: log.track?.artist ?? '음악 없음',
    createdAt: log.createdAt,
    id: log.id,
    imageUrl: log.photoUri,
    placeName: log.placeName ?? '위치 없음',
    recapShareId: log.id,
    trackTitle: log.track?.title ?? '저장된 순간',
  };
}

function sortByNewest(logs: MomentLog[]) {
  return [...logs].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime();
    const secondTime = new Date(second.createdAt).getTime();

    return secondTime - firstTime;
  });
}

function getPendingActionId(
  type: MomentLogPendingAction['type'],
  momentLogId: string,
) {
  return `${type}:${momentLogId}`;
}

function dedupePendingActions(actions: MomentLogPendingAction[]) {
  return Array.from(
    new Map(actions.map((action) => [action.id, action])).values(),
  );
}

function remapPendingAction(
  action: MomentLogPendingAction,
  nextMomentLogId: string,
): MomentLogPendingAction {
  return {
    ...action,
    id: getPendingActionId(action.type, nextMomentLogId),
    momentLogId: nextMomentLogId,
  } as MomentLogPendingAction;
}

export const useMomentLogStore = create<MomentLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      pendingActions: [],
      quarantinedLogs: [],
      quarantinedPendingActions: [],
      addLog: (log) =>
        set((state) => {
          const owned: OwnedMomentLog = {
            ...log,
            ownerUserId: useAuthStore.getState().user?.id,
          };

          return {
            logs: [owned, ...state.logs.filter((item) => item.id !== log.id)],
          };
        }),
      getRecentLogs: (limit = 10) => get().logs.slice(0, limit),
      mergeServerLogs: (serverLogs) =>
        set((state) => {
          const ownerUserId = useAuthStore.getState().user?.id;
          const pendingDeleteIds = new Set(
            state.pendingActions
              .filter((action) => action.type === 'delete')
              .map((action) => action.momentLogId),
          );
          const pendingEditIds = new Set(
            state.pendingActions
              .filter((action) => action.type === 'edit')
              .map((action) => action.momentLogId),
          );
          const localLogsById = new Map(state.logs.map((log) => [log.id, log]));
          const visibleServerLogs: OwnedMomentLog[] = serverLogs
            .filter((log) => !pendingDeleteIds.has(log.id))
            .map((log) =>
              pendingEditIds.has(log.id)
                ? (localLogsById.get(log.id) ?? log)
                : { ...log, ownerUserId },
            );
          const serverLogIds = new Set(visibleServerLogs.map((log) => log.id));
          const localOnlyLogs = state.logs.filter(
            (log) => !serverLogIds.has(log.id) && !pendingDeleteIds.has(log.id),
          );

          return {
            logs: sortByNewest([...visibleServerLogs, ...localOnlyLogs]),
          };
        }),
      queueCreate: (momentLogId, payload) =>
        set((state) => {
          const createActionId = getPendingActionId('create', momentLogId);
          const hasPendingDelete = state.pendingActions.some(
            (action) =>
              action.type === 'delete' && action.momentLogId === momentLogId,
          );

          if (hasPendingDelete) {
            return state;
          }

          return {
            pendingActions: [
              ...state.pendingActions.filter(
                (action) => action.id !== createActionId,
              ),
              {
                id: createActionId,
                momentLogId,
                ownerUserId: useAuthStore.getState().user?.id,
                payload,
                queuedAt: new Date().toISOString(),
                type: 'create',
              },
            ],
          };
        }),
      queueEdit: (momentLogId, payload) =>
        set((state) => {
          const editActionId = getPendingActionId('edit', momentLogId);
          const hasPendingDelete = state.pendingActions.some(
            (action) =>
              action.type === 'delete' && action.momentLogId === momentLogId,
          );

          if (hasPendingDelete) {
            return state;
          }

          return {
            pendingActions: [
              ...state.pendingActions.filter(
                (action) => action.id !== editActionId,
              ),
              {
                id: editActionId,
                momentLogId,
                ownerUserId: useAuthStore.getState().user?.id,
                payload,
                queuedAt: new Date().toISOString(),
                type: 'edit',
              },
            ],
          };
        }),
      queueDelete: (log) =>
        set((state) => {
          const deleteActionId = getPendingActionId('delete', log.id);

          return {
            logs: state.logs.filter((item) => item.id !== log.id),
            pendingActions: [
              ...state.pendingActions.filter(
                (action) => action.momentLogId !== log.id,
              ),
              {
                id: deleteActionId,
                momentLogId: log.id,
                ownerUserId: useAuthStore.getState().user?.id,
                queuedAt: new Date().toISOString(),
                type: 'delete',
              },
            ],
          };
        }),
      reconcileOwnership: (currentUserId) =>
        set((state) => {
          const allLogs = [
            ...state.logs,
            ...state.quarantinedLogs,
          ] as OwnedMomentLog[];
          const allActions = [
            ...state.pendingActions,
            ...state.quarantinedPendingActions,
          ];
          const visibleLogs: OwnedMomentLog[] = [];
          const hiddenLogs: OwnedMomentLog[] = [];
          const seenLogIds = new Set<string>();

          for (const log of allLogs) {
            if (seenLogIds.has(log.id)) {
              continue;
            }
            seenLogIds.add(log.id);

            if (currentUserId && log.ownerUserId === currentUserId) {
              visibleLogs.push(log);
            } else {
              hiddenLogs.push(log);
            }
          }

          const visibleActions: MomentLogPendingAction[] = [];
          const hiddenActions: MomentLogPendingAction[] = [];
          const seenActionIds = new Set<string>();

          for (const action of allActions) {
            if (seenActionIds.has(action.id)) {
              continue;
            }
            seenActionIds.add(action.id);

            if (currentUserId && action.ownerUserId === currentUserId) {
              visibleActions.push(action);
            } else {
              hiddenActions.push(action);
            }
          }

          return {
            logs: sortByNewest(visibleLogs),
            pendingActions: visibleActions,
            quarantinedLogs: hiddenLogs,
            quarantinedPendingActions: hiddenActions,
          };
        }),
      removePendingAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter(
            (action) => action.id !== id,
          ),
        })),
      removeLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((item) => item.id !== id),
          pendingActions: state.pendingActions.filter(
            (action) => action.momentLogId !== id,
          ),
          quarantinedLogs: state.quarantinedLogs.filter(
            (item) => item.id !== id,
          ),
          quarantinedPendingActions: state.quarantinedPendingActions.filter(
            (action) => action.momentLogId !== id,
          ),
        })),
      resolveLocalLog: (localMomentLogId, serverLog) =>
        set((state) => {
          const hasLocalLog = state.logs.some(
            (item) => item.id === localMomentLogId,
          );

          if (!hasLocalLog) {
            return state;
          }

          const ownedServerLog: OwnedMomentLog = {
            ...serverLog,
            ownerUserId: useAuthStore.getState().user?.id,
          };
          const remappedActions = state.pendingActions
            .filter(
              (action) =>
                !(
                  action.type === 'create' &&
                  action.momentLogId === localMomentLogId
                ),
            )
            .map((action) =>
              action.momentLogId === localMomentLogId
                ? remapPendingAction(action, serverLog.id)
                : action,
            );

          return {
            logs: sortByNewest([
              ownedServerLog,
              ...state.logs.filter(
                (item) =>
                  item.id !== localMomentLogId && item.id !== serverLog.id,
              ),
            ]),
            pendingActions: dedupePendingActions(remappedActions),
          };
        }),
      updateLog: (id, patch) =>
        set((state) => ({
          logs: state.logs.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        })),
    }),
    {
      // v1 introduced `ownerUserId` on MomentLogPendingAction.
      // v2 introduces `quarantinedLogs` / `quarantinedPendingActions`. Older
      // persisted state simply lacks both fields — that's the "unknown
      // owner" state sync/display gating treats as quarantined, so no data
      // transform is required beyond defaulting the new arrays to empty.
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<MomentLogState>;

        return {
          ...state,
          logs: state.logs ?? [],
          pendingActions: state.pendingActions ?? [],
          quarantinedLogs: state.quarantinedLogs ?? [],
          quarantinedPendingActions: state.quarantinedPendingActions ?? [],
        } as MomentLogState;
      },
      name: 'soundlog-moment-logs',
      // Fires once this store's own persisted logs/pendingActions have
      // loaded. Needed in addition to the useAuthStore.subscribe below:
      // on cold start, auth can finish hydrating (and fire its
      // subscription) before THIS store's async storage read resolves, in
      // which case reconciliation at that point runs against an empty
      // in-memory state. This closes that gap by re-running reconciliation
      // once real persisted data is in place.
      onRehydrateStorage: () => () => {
        reconcileMomentLogOwnershipWithCurrentAuth();
      },
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
    },
  ),
);

// --- Cross-account display/sync isolation -----------------------------
//
// `reconcileOwnership` must run synchronously the instant the authenticated
// account changes (login, logout, refresh failure) — BEFORE React renders
// any screen that reads `logs`/`pendingActions`. A `useEffect` in a
// provider component is too late: effects run after commit, so a screen
// can paint one frame of the previous account's data first. Subscribing to
// useAuthStore directly, here at module scope, means our listener runs
// synchronously inside the very `set()` call that logs the new account in,
// before React's own re-render of any subscribed screen is committed.
let lastReconciledOwnerUserId: string | undefined;
let hasReconciledSinceHydration = false;

function reconcileMomentLogOwnershipWithCurrentAuth() {
  const authState = useAuthStore.getState();

  // Guard against cold start: before auth has hydrated, `user` is
  // transiently undefined even for an already-logged-in device. Treating
  // that as "logged out" would needlessly quarantine everything.
  if (!authState.isHydrated) {
    return;
  }

  const ownerUserId = authState.user?.id;

  if (hasReconciledSinceHydration && ownerUserId === lastReconciledOwnerUserId) {
    return;
  }

  hasReconciledSinceHydration = true;
  lastReconciledOwnerUserId = ownerUserId;
  useMomentLogStore.getState().reconcileOwnership(ownerUserId);
}

useAuthStore.subscribe(() => {
  reconcileMomentLogOwnershipWithCurrentAuth();
});
