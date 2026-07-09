import { useQuery } from '@tanstack/react-query';

import {
  playlistApi,
  type ContextualPlaylistInput,
} from '@/api/playlistApi';

type PlaylistQueryOptions = {
  enabled?: boolean;
};

export const playlistQueryKeys = {
  detail: (id?: string) => ['playlist', 'detail', id ?? 'fallback'] as const,
  recommended: (input: ContextualPlaylistInput) =>
    ['playlist', 'recommended', input] as const,
};

export function usePlaylistCurationQuery(id?: string) {
  return useQuery({
    queryFn: () => playlistApi.getPlaylist(id),
    queryKey: playlistQueryKeys.detail(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendedPlaylistQuery(
  input: ContextualPlaylistInput,
  options: PlaylistQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled ?? Boolean(input.location),
    queryFn: () => playlistApi.getRecommendedPlaylist(input),
    queryKey: playlistQueryKeys.recommended(input),
    staleTime: 2 * 60 * 1000,
  });
}
