import { ApiError, shouldAttemptAuthenticatedApi } from '@/api/client';
import { recapApi } from '@/api/recapApi';
import { travelSessionApi } from '@/api/travelSessionApi';
import { useMomentLogStore } from '@/store/momentLogStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';

export type TravelLogSyncResult = {
  createdRecapIds: Record<string, string>;
  deferredCount: number;
  failureCount: number;
  successCount: number;
};

let activeFlushPromise: Promise<TravelLogSyncResult> | undefined;

async function performFlush(): Promise<TravelLogSyncResult> {
  const result: TravelLogSyncResult = {
    createdRecapIds: {},
    deferredCount: 0,
    failureCount: 0,
    successCount: 0,
  };

  if (!shouldAttemptAuthenticatedApi()) {
    return result;
  }

  const pendingFinalizations = [
    ...useTravelLogSyncStore.getState().pendingFinalizations,
  ];

  for (const finalization of pendingFinalizations) {
    const momentState = useMomentLogStore.getState();

    if (momentState.pendingActions.length > 0) {
      result.deferredCount += 1;
      continue;
    }

    const sessionLogs = momentState.logs.filter(
      (log) => log.sessionId === finalization.sessionId,
    );

    if (sessionLogs.length === 0) {
      useTravelLogSyncStore.getState().removeFinalization(finalization.id);
      result.successCount += 1;
      continue;
    }

    if (sessionLogs.some((log) => log.syncStatus !== 'synced')) {
      result.deferredCount += 1;
      continue;
    }

    try {
      try {
        await travelSessionApi.endTravelSession(finalization.sessionId, {
          endedAt: finalization.endedAt,
          location: finalization.location,
          routePoints: finalization.routePoints,
        });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) {
          throw error;
        }
      }

      const representativeTrackId = sessionLogs.find((log) => log.track?.id)
        ?.track?.id;
      const recap = await recapApi.createRecap(
        {
          momentLogIds: sessionLogs.map((log) => log.id),
          representativeTrackId,
          routePoints: finalization.routePoints,
          sessionId: finalization.sessionId,
          templateId: finalization.templateId,
          title: finalization.title,
          visibility: 'private',
        },
        finalization.id,
      );

      if (!recap) {
        throw new Error('Travel Log create was not accepted by the server.');
      }

      result.createdRecapIds[finalization.sessionId] = recap.id;
      result.successCount += 1;
      useTravelLogSyncStore.getState().removeFinalization(finalization.id);

      const travelSessionState = useTravelSessionStore.getState();

      if (travelSessionState.session.id === finalization.sessionId) {
        travelSessionState.setSessionRecapId(recap.id);
      }
    } catch {
      result.failureCount += 1;
    }
  }

  return result;
}

export function flushPendingTravelLogFinalizations() {
  activeFlushPromise ??= performFlush().finally(() => {
    activeFlushPromise = undefined;
  });

  return activeFlushPromise;
}
