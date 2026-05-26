import { useQuery } from '@tanstack/react-query';

import { recapApi } from '@/api/recapApi';

export const recapQueryKeys = {
  list: ['recaps', 'list'] as const,
  share: (id?: string) => ['recaps', 'share', id ?? 'fallback'] as const,
};

type RecapShareQueryOptions = {
  enabled?: boolean;
};

export function useRecapListQuery() {
  return useQuery({
    queryFn: recapApi.getRecapList,
    queryKey: recapQueryKeys.list,
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
