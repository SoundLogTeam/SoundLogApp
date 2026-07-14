import { ApiError, shouldAttemptAuthenticatedApi } from "@/api/client";
import { momentLogApi } from "@/api/momentLogApi";
import { recapApi } from "@/api/recapApi";
import {
  useMomentLogStore,
  type MomentLogPendingAction,
} from "@/store/momentLogStore";

export type MomentLogSyncResult = {
  failureCount: number;
  successCount: number;
};

let activeFlushPromise: Promise<MomentLogSyncResult> | undefined;

async function syncCreateAction(
  action: Extract<MomentLogPendingAction, { type: "create" }>,
) {
  const store = useMomentLogStore.getState();
  const localMoment = store.logs.find(
    (moment) => moment.id === action.momentLogId,
  );

  if (!localMoment) {
    store.removePendingAction(action.id);
    return;
  }

  store.updateLog(action.momentLogId, {
    syncError: undefined,
    syncStatus: "pending",
  });

  const serverLog = await momentLogApi.createMomentLog({
    ...action.payload,
    idempotencyKey: action.momentLogId,
  });

  if (!serverLog) {
    throw new Error("Moment create was not accepted by the server.");
  }

  let recapId: string | undefined;

  if (!action.payload.sessionId) {
    const recap = await recapApi.createRecap(
      {
        momentLogIds: [serverLog.id],
        templateId: action.payload.templateId ?? "film",
        visibility: action.payload.recapVisibility ?? "private",
      },
      `standalone-recap:${action.momentLogId}`,
    );

    if (!recap) {
      throw new Error(
        "Standalone recap create was not accepted by the server.",
      );
    }

    recapId = recap.id;
  }

  useMomentLogStore.getState().resolveLocalLog(action.momentLogId, {
    ...serverLog,
    recapId,
    recapVisibility: action.payload.recapVisibility,
    templateId: action.payload.templateId,
  });
}

async function syncDeleteAction(
  action: Extract<MomentLogPendingAction, { type: "delete" }>,
) {
  try {
    const accepted = await momentLogApi.deleteMomentLog(action.momentLogId);

    if (!accepted) {
      throw new Error("Moment delete was not accepted by the server.");
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }

  useMomentLogStore.getState().removePendingAction(action.id);
}

async function syncEditAction(
  action: Extract<MomentLogPendingAction, { type: "edit" }>,
) {
  const store = useMomentLogStore.getState();
  const localMoment = store.logs.find(
    (moment) => moment.id === action.momentLogId,
  );

  if (!localMoment) {
    store.removePendingAction(action.id);
    return;
  }

  if (action.payload.removePhoto) {
    const updatedLog = await momentLogApi.deleteMomentLogPhoto(
      action.momentLogId,
    );

    if (!updatedLog) {
      throw new Error("Moment photo delete was not accepted by the server.");
    }
  } else if (action.payload.replacePhotoUri) {
    const updatedLog = await momentLogApi.updateMomentLogPhoto(
      action.momentLogId,
      action.payload.replacePhotoUri,
    );

    if (!updatedLog) {
      throw new Error("Moment photo update was not accepted by the server.");
    }
  }

  const serverLog = await momentLogApi.updateMomentLog(action.momentLogId, {
    moodTags: action.payload.moodTags,
    note: action.payload.note,
    placeName: action.payload.placeName,
    track: action.payload.track,
  });

  if (!serverLog) {
    throw new Error("Moment edit was not accepted by the server.");
  }

  const nextStore = useMomentLogStore.getState();
  nextStore.updateLog(action.momentLogId, serverLog);
  nextStore.removePendingAction(action.id);
}

async function syncAction(action: MomentLogPendingAction) {
  if (action.type === "create") {
    await syncCreateAction(action);
    return;
  }

  if (action.type === "delete") {
    await syncDeleteAction(action);
    return;
  }

  await syncEditAction(action);
}

async function performFlush(): Promise<MomentLogSyncResult> {
  if (!shouldAttemptAuthenticatedApi()) {
    return { failureCount: 0, successCount: 0 };
  }

  const actions = [...useMomentLogStore.getState().pendingActions];
  let failureCount = 0;
  let successCount = 0;

  for (const action of actions) {
    try {
      await syncAction(action);
      successCount += 1;
    } catch (error) {
      failureCount += 1;

      if (action.type === "create") {
        useMomentLogStore.getState().updateLog(action.momentLogId, {
          syncError:
            error instanceof Error
              ? error.message
              : "리캡을 서버와 동기화하지 못했어요.",
          syncStatus: "failed",
        });
      }
    }
  }

  return { failureCount, successCount };
}

export function flushPendingMomentActions() {
  activeFlushPromise ??= performFlush().finally(() => {
    activeFlushPromise = undefined;
  });

  return activeFlushPromise;
}
