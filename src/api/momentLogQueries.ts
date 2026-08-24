import { useQuery } from '@tanstack/react-query';

import { momentLogApi, type MomentLogListParams } from '@/api/momentLogApi';

export const momentLogQueryKeys = {
  all: ['moment-logs'] as const,
  allPages: (params: Omit<MomentLogListParams, 'cursor' | 'limit'> = {}) =>
    ['moment-logs', 'all-pages', params] as const,
  list: (params: MomentLogListParams = {}) => ['moment-logs', 'list', params] as const,
};

type MomentLogListQueryOptions = {
  enabled?: boolean;
};

export function useMomentLogListQuery(
  params: MomentLogListParams = {},
  options: MomentLogListQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => momentLogApi.getMomentLogs(params),
    queryKey: momentLogQueryKeys.list(params),
    staleTime: 60 * 1000,
  });
}

export function useAllMomentLogListQuery(
  params: Omit<MomentLogListParams, 'cursor' | 'limit'> = {},
  options: MomentLogListQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => momentLogApi.getAllMomentLogs(params),
    queryKey: momentLogQueryKeys.allPages(params),
    staleTime: 60 * 1000,
  });
}
