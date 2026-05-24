import { useQuery } from '@tanstack/react-query';

import { homeApi } from '@/api/homeApi';

type MoodRecommendationParams = {
  moodFilter: string;
  topFilter: string;
};

export function useFeaturedPlaylistsQuery() {
  return useQuery({
    queryFn: homeApi.getFeaturedPlaylists,
    queryKey: ['home', 'featured-playlists'],
  });
}

export function useMoodRecommendationsQuery(params: MoodRecommendationParams) {
  return useQuery({
    queryFn: () => homeApi.getMoodRecommendations(params),
    queryKey: ['home', 'mood-recommendations', params],
  });
}

export function useRecentMusicLogsQuery() {
  return useQuery({
    queryFn: homeApi.getRecentMusicLogs,
    queryKey: ['home', 'recent-music-logs'],
  });
}
