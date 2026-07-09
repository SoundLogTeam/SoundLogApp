import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { GeoPoint, MomentLog, MoodTag, MusicLogItem, Track, TravelMode } from '@/types/domain';

export type MomentLogCreateQueuePayload = {
  createdAt: string;
  location?: GeoPoint;
  moodTags: MoodTag[];
  note?: string;
  photoUri?: string;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  sessionId?: string;
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
      payload: MomentLogCreateQueuePayload;
      queuedAt: string;
      type: 'create';
    }
  | {
      id: string;
      momentLogId: string;
      payload: MomentLogEditQueuePayload;
      queuedAt: string;
      type: 'edit';
    }
  | {
      id: string;
      momentLogId: string;
      queuedAt: string;
      type: 'delete';
    };

type MomentLogState = {
  logs: MomentLog[];
  pendingActions: MomentLogPendingAction[];
  addLog: (log: MomentLog) => void;
  getRecentLogs: (limit?: number) => MomentLog[];
  mergeServerLogs: (logs: MomentLog[]) => void;
  queueCreate: (momentLogId: string, payload: MomentLogCreateQueuePayload) => void;
  queueEdit: (momentLogId: string, payload: MomentLogEditQueuePayload) => void;
  queueDelete: (log: MomentLog) => void;
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

function getPendingActionId(type: MomentLogPendingAction['type'], momentLogId: string) {
  return `${type}:${momentLogId}`;
}

function dedupePendingActions(actions: MomentLogPendingAction[]) {
  return Array.from(new Map(actions.map((action) => [action.id, action])).values());
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
      addLog: (log) =>
        set((state) => ({
          logs: [log, ...state.logs.filter((item) => item.id !== log.id)],
        })),
      getRecentLogs: (limit = 10) => get().logs.slice(0, limit),
      mergeServerLogs: (serverLogs) =>
        set((state) => {
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
          const visibleServerLogs = serverLogs
            .filter((log) => !pendingDeleteIds.has(log.id))
            .map((log) => (pendingEditIds.has(log.id) ? localLogsById.get(log.id) ?? log : log));
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
            (action) => action.type === 'delete' && action.momentLogId === momentLogId,
          );

          if (hasPendingDelete) {
            return state;
          }

          return {
            pendingActions: [
              ...state.pendingActions.filter((action) => action.id !== createActionId),
              {
                id: createActionId,
                momentLogId,
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
            (action) => action.type === 'delete' && action.momentLogId === momentLogId,
          );

          if (hasPendingDelete) {
            return state;
          }

          return {
            pendingActions: [
              ...state.pendingActions.filter((action) => action.id !== editActionId),
              {
                id: editActionId,
                momentLogId,
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
              ...state.pendingActions.filter((action) => action.momentLogId !== log.id),
              {
                id: deleteActionId,
                momentLogId: log.id,
                queuedAt: new Date().toISOString(),
                type: 'delete',
              },
            ],
          };
        }),
      removePendingAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter((action) => action.id !== id),
        })),
      removeLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((item) => item.id !== id),
          pendingActions: state.pendingActions.filter((action) => action.momentLogId !== id),
        })),
      resolveLocalLog: (localMomentLogId, serverLog) =>
        set((state) => {
          const hasLocalLog = state.logs.some((item) => item.id === localMomentLogId);

          if (!hasLocalLog) {
            return state;
          }

          const remappedActions = state.pendingActions
            .filter(
              (action) =>
                !(action.type === 'create' && action.momentLogId === localMomentLogId),
            )
            .map((action) =>
              action.momentLogId === localMomentLogId
                ? remapPendingAction(action, serverLog.id)
                : action,
            );

          return {
            logs: sortByNewest([
              serverLog,
              ...state.logs.filter(
                (item) => item.id !== localMomentLogId && item.id !== serverLog.id,
              ),
            ]),
            pendingActions: dedupePendingActions(remappedActions),
          };
        }),
      updateLog: (id, patch) =>
        set((state) => ({
          logs: state.logs.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
    }),
    {
      name: 'soundlog-moment-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
