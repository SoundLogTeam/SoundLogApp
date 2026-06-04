import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

import { queryClient } from '@/providers/queryClient';

const DevTestManager = __DEV__
  ? require('@/components/dev/DevTestManager').DevTestManager
  : undefined;

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {DevTestManager ? <DevTestManager /> : null}
    </QueryClientProvider>
  );
}
