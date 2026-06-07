import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { queryClient } from '@/providers/queryClient';

const DevTestManager = __DEV__ && Platform.OS !== 'web'
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
