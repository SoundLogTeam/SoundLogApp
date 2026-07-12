import { useQuery } from '@tanstack/react-query';

import { recapApi, type RecapListScope } from '@/api/recapApi';

export const recapQueryKeys = {
  lists: ['recaps', 'list'] as const,
  list: (scope: RecapListScope = 'mine') => ['recaps', 'list', scope] as const,
  share: (id?: string) => ['recaps', 'share', id ?? 'fallback'] as const,
};

type RecapShareQueryOptions = {
  enabled?: boolean;
};

export function useRecapListQuery(scope: RecapListScope = 'mine') {
  return useQuery({
    queryFn: () => recapApi.getRecapList({ scope }),
    queryKey: recapQueryKeys.list(scope),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecapShareQuery(
  id?: string,
  options: RecapShareQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => recapApi.getRecapShare(id),
    queryKey: recapQueryKeys.share(id),
    staleTime: 5 * 60 * 1000,
  });
}
