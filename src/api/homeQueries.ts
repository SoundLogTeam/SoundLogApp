import { useQuery } from '@tanstack/react-query';

import {
  homeApi,
  type FeaturedPlaylistParams,
  type MoodRecommendationParams,
} from '@/api/homeApi';

type HomeQueryOptions = {
  enabled?: boolean;
};

export function useFeaturedPlaylistsQuery(
  params: FeaturedPlaylistParams,
  options: HomeQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => homeApi.getFeaturedPlaylists(params),
    queryKey: ['home', 'featured-playlists', params],
  });
}

export function useMoodRecommendationsQuery(
  params: MoodRecommendationParams,
  options: HomeQueryOptions = {},
) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => homeApi.getMoodRecommendations(params),
    queryKey: ['home', 'mood-recommendations', params],
  });
}

export function useRecentMusicLogsQuery(options: HomeQueryOptions = {}) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: homeApi.getRecentMusicLogs,
    queryKey: ['home', 'recent-music-logs'],
  });
}
