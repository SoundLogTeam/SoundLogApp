import { useQuery } from '@tanstack/react-query';

import { recapApi } from '@/api/recapApi';

export const recapQueryKeys = {
  list: ['recaps', 'list'] as const,
  share: (id?: string) => ['recaps', 'share', id ?? 'fallback'] as const,
};

export function useRecapShareQuery(id?: string) {
  return useQuery({
    queryFn: () => recapApi.getRecapShare(id),
    queryKey: recapQueryKeys.share(id),
    staleTime: 5 * 60 * 1000,
  });
}
