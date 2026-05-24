import { useQuery } from '@tanstack/react-query';

import { playlistApi } from '@/api/playlistApi';

export const playlistQueryKeys = {
  detail: (id?: string) => ['playlist', 'detail', id ?? 'fallback'] as const,
};

export function usePlaylistCurationQuery(id?: string) {
  return useQuery({
    queryFn: () => playlistApi.getPlaylist(id),
    queryKey: playlistQueryKeys.detail(id),
    staleTime: 5 * 60 * 1000,
  });
}
