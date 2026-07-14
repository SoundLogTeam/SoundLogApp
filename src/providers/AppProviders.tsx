import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { queryClient } from '@/providers/queryClient';
import { MomentLogSyncWorker } from '@/providers/MomentLogSyncWorker';
import { useAuthStore } from '@/store/authStore';

const DevTestManager = __DEV__ && Platform.OS !== 'web'
  ? require('@/components/dev/DevTestManager').DevTestManager
  : undefined;

function AuthScopedQueryCache({ children }: PropsWithChildren) {
  const scopedQueryClient = useQueryClient();
  const authScope = useAuthStore((state) =>
    state.isHydrated
      ? `${state.status}:${state.user?.id ?? 'anonymous'}`
      : undefined,
  );
  const previousAuthScope = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!authScope) {
      return;
    }

    if (previousAuthScope.current && previousAuthScope.current !== authScope) {
      scopedQueryClient.clear();
    }

    previousAuthScope.current = authScope;
  }, [authScope, scopedQueryClient]);

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthScopedQueryCache>
        {children}
        <MomentLogSyncWorker />
        {DevTestManager ? <DevTestManager /> : null}
      </AuthScopedQueryCache>
    </QueryClientProvider>
  );
}
