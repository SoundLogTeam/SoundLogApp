import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { momentLogQueryKeys } from '@/api/momentLogQueries';
import { recapQueryKeys } from '@/api/recapQueries';
import { useAuthStore } from '@/store/authStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
import { flushPendingMomentActions } from '@/utils/momentLogSync';
import { flushPendingTravelLogFinalizations } from '@/utils/travelLogSync';

const RETRY_INTERVAL_MS = 30_000;

// Note: account-ownership reconciliation (quarantining/restoring drafts on
// login/logout) is NOT handled here. A React `useEffect` runs after commit,
// which left a one-frame window where a freshly-rendered screen could read
// the previous account's `logs` before reconciliation caught up. Instead,
// `src/store/momentLogStore.ts` subscribes to `useAuthStore` directly at
// module scope, so reconciliation runs synchronously inside the same
// `set()` call that logs a user in/out — before React has a chance to
// render anything against the stale state. See `reconcileOwnership` and
// the `useAuthStore.subscribe(...)` call there.

export function MomentLogSyncWorker() {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((state) => state.status);
  const pendingActionCount = useMomentLogStore((state) => state.pendingActions.length);
  const pendingFinalizationCount = useTravelLogSyncStore(
    (state) => state.pendingFinalizations.length,
  );

  const flush = useCallback(async () => {
    if (
      authStatus !== 'authenticated' ||
      (pendingActionCount === 0 && pendingFinalizationCount === 0)
    ) {
      return;
    }

    const momentResult = await flushPendingMomentActions();
    const logResult = await flushPendingTravelLogFinalizations();

    if (momentResult.successCount > 0 || logResult.successCount > 0) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists }),
      ]);
    }
  }, [authStatus, pendingActionCount, pendingFinalizationCount, queryClient]);

  useEffect(() => {
    void flush();
  }, [flush]);

  useEffect(() => {
    if (
      authStatus !== 'authenticated' ||
      (pendingActionCount === 0 && pendingFinalizationCount === 0)
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      void flush();
    }, RETRY_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flush();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [authStatus, flush, pendingActionCount, pendingFinalizationCount]);

  return null;
}
