import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

import { queryClient } from '@/providers/queryClient';

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
