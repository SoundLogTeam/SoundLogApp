import { authApi } from '@/api/authApi';
import { createIdempotencyKey } from '@/api/client';
import { libraryApi } from '@/api/libraryApi';
import { momentLogApi } from '@/api/momentLogApi';
import { meApi } from '@/api/meApi';
import { useLibraryStore } from '@/store/libraryStore';
import {
  useMomentLogStore,
  type MomentLogCreateQueuePayload,
  type MomentLogPendingAction,
} from '@/store/momentLogStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import type { MomentLog } from '@/types/domain';

export type LocalDataMigrationSummary = {
  libraryTrackCount: number;
  momentLogCount: number;
  recapDraftCount: number;
};

export type LocalDataMigrationSyncResult = {
  libraryFailedCount: number;
  librarySyncedCount: number;
  migrationAccepted: boolean;
  momentLogFailedCount: number;
  momentLogSyncedCount: number;
  summary: LocalDataMigrationSummary;
};

function momentLogCreatePayloadFromLog(
  log: MomentLog,
): MomentLogCreateQueuePayload {
  return {
    createdAt: log.createdAt,
    location: log.location,
    moodTags: log.moodTags,
    note: log.note,
    photoUri: log.photoUri,
    placeCategory: log.placeCategory,
    placeId: log.placeId,
    placeName: log.placeName,
    recapVisibility: 'private',
    sessionId: log.sessionId,
    templateId: log.templateId,
    track: log.track,
    travelMode: log.travelMode,
  };
}

function isCreatePendingAction(
  action: MomentLogPendingAction,
): action is Extract<MomentLogPendingAction, { type: 'create' }> {
  return action.type === 'create';
}

export function getLocalDataMigrationSummary(): LocalDataMigrationSummary {
  const { likedTracks, savedTracks } = useLibraryStore.getState();
  const { logs } = useMomentLogStore.getState();

  return {
    libraryTrackCount: likedTracks.length + savedTracks.length,
    momentLogCount: logs.length,
    recapDraftCount: logs.length > 0 ? 1 : 0,
  };
}

async function syncCompletedLocalProfile() {
  const { profile } = useUserProfileStore.getState();

  if (!profile.completedOnboarding) {
    return;
  }

  await meApi.updateProfile(profile);
}

async function syncLocalMomentLogs() {
  const { logs, pendingActions, queueCreate, resolveLocalLog, updateLog } =
    useMomentLogStore.getState();
  let syncedCount = 0;
  let failedCount = 0;

  for (const log of logs) {
    if (log.syncStatus === 'synced') {
      continue;
    }

    const queuedCreateAction = pendingActions
      .filter(isCreatePendingAction)
      .find((action) => action.momentLogId === log.id);
    const payload =
      queuedCreateAction?.payload ?? momentLogCreatePayloadFromLog(log);

    queueCreate(log.id, payload);
    updateLog(log.id, { syncStatus: 'pending' });

    try {
      const serverLog = await momentLogApi.createMomentLog({
        ...payload,
        idempotencyKey: log.id,
      });

      if (!serverLog) {
        updateLog(log.id, { syncStatus: 'local' });
        failedCount += 1;
        continue;
      }

      resolveLocalLog(log.id, serverLog);
      syncedCount += 1;
    } catch {
      queueCreate(log.id, payload);
      updateLog(log.id, { syncStatus: 'failed' });
      failedCount += 1;
    }
  }

  return { failedCount, syncedCount };
}

async function syncLocalLibrary() {
  const { likedTracks, savedTracks } = useLibraryStore.getState();
  let syncedCount = 0;
  let failedCount = 0;

  const records = [
    ...likedTracks.map((record) => ({ action: 'like' as const, record })),
    ...savedTracks.map((record) => ({ action: 'save' as const, record })),
  ];

  for (const { action, record } of records) {
    try {
      const result = await libraryApi.updateTrackState(record.track.id, {
        action,
        playlistId: record.playlistId,
      });

      if (!result) {
        failedCount += 1;
        continue;
      }

      syncedCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  return { failedCount, syncedCount };
}

export async function migrateLocalDataToAccount(): Promise<LocalDataMigrationSyncResult> {
  const summary = getLocalDataMigrationSummary();
  let migrationAccepted = false;

  try {
    const migration = await authApi.migrateLocalData({
      ...summary,
      idempotencyKey: createIdempotencyKey('migration'),
    });

    migrationAccepted = migration.accepted;
  } catch {
    migrationAccepted = false;
  }

  await syncCompletedLocalProfile().catch(() => undefined);

  const [momentLogResult, libraryResult] = await Promise.all([
    syncLocalMomentLogs(),
    syncLocalLibrary(),
  ]);

  return {
    libraryFailedCount: libraryResult.failedCount,
    librarySyncedCount: libraryResult.syncedCount,
    migrationAccepted,
    momentLogFailedCount: momentLogResult.failedCount,
    momentLogSyncedCount: momentLogResult.syncedCount,
    summary,
  };
}
