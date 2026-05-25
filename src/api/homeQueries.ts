import { useQuery } from '@tanstack/react-query';

import { homeApi } from '@/api/homeApi';
import { GeoPoint } from '@/types/domain';

type FeaturedPlaylistParams = {
  location?: GeoPoint;
  locationRecommendationEnabled: boolean;
};

type MoodRecommendationParams = {
  moodFilter: string;
  preferredGenres?: string[];
  preferredMoods?: string[];
  topFilter: string;
  travelStyles?: string[];
};

export function useFeaturedPlaylistsQuery(params: FeaturedPlaylistParams) {
  return useQuery({
    queryFn: () => homeApi.getFeaturedPlaylists(params),
    queryKey: ['home', 'featured-playlists', params],
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
