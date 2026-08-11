import { ApiError, shouldAttemptAuthenticatedApi } from '@/api/client';
import { recapApi } from '@/api/recapApi';
import { travelSessionApi } from '@/api/travelSessionApi';
import { useAuthStore } from '@/store/authStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import {
  useTravelLogSyncStore,
  type PendingTravelLogFinalization,
} from '@/store/travelLogSyncStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';

// Mirrors momentLogSync's account gate: only finalize a Log finalization
// queued by the account that is currently logged in. Unknown owner (legacy
// data, or queued while signed out) stays quarantined.
function belongsToCurrentAccount(finalization: PendingTravelLogFinalization) {
  const currentUserId = useAuthStore.getState().user?.id;

  return (
    Boolean(finalization.ownerUserId) &&
    finalization.ownerUserId === currentUserId
  );
}

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
  ].filter(belongsToCurrentAccount);

  for (const finalization of pendingFinalizations) {
    const momentState = useMomentLogStore.getState();

    // Only pending actions that belong to THIS session may block its Log
    // confirmation. A pending action has no sessionId of its own, so we
    // resolve it via the moment log it targets. Actions whose log is no
    // longer present (e.g. an already-queued delete removed it from
    // `logs`) can't affect this session's finalized content, since the
    // sessionLogs computation below also no longer includes it.
    const sessionPendingActionCount = momentState.pendingActions.filter(
      (action) =>
        momentState.logs.find((log) => log.id === action.momentLogId)
          ?.sessionId === finalization.sessionId,
    ).length;

    if (sessionPendingActionCount > 0) {
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
