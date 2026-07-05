import { requestApi, shouldAttemptAuthenticatedApi } from '@/api/client';
import type {
  FeaturedPlaylist,
  GeoPoint,
  MoodRecommendation,
  MusicLogItem,
  MusicRecommendationMode,
  PlaceContext,
} from '@/types/domain';
import { sanitizeMoodRecommendation } from '@/utils/trackSanitizer';

type FeaturedPlaylistParams = {
  location?: GeoPoint;
  locationRecommendationEnabled?: boolean;
  recommendationMode?: MusicRecommendationMode;
  place?: PlaceContext;
};

type MoodRecommendationParams = {
  currentPlace?: PlaceContext;
  moodFilter?: string;
  recommendationMode?: MusicRecommendationMode;
  preferredGenres?: string[];
  preferredMoods?: string[];
  topFilter?: string;
  travelStyles?: string[];
};

export const homeApi = {
  getFeaturedPlaylists: async (params?: FeaturedPlaylistParams) => {
    return requestApi<FeaturedPlaylist[]>('/v1/home/featured-playlists', {
      query: {
        lat: params?.location?.lat,
        limit: 10,
        lng: params?.location?.lng,
        locationRecommendationEnabled: params?.locationRecommendationEnabled ?? false,
        placeId: params?.place?.id,
        recommendationMode: params?.recommendationMode ?? 'everyday',
      },
    });
  },
  getMoodRecommendations: async (params?: MoodRecommendationParams) => {
    const recommendations = await requestApi<MoodRecommendation[]>('/v1/home/mood-recommendations', {
      query: {
        limit: 10,
        moodFilter: params?.moodFilter ?? '전체',
        preferredGenres: params?.preferredGenres,
        preferredMoods: params?.preferredMoods,
        recommendationMode: params?.recommendationMode ?? 'everyday',
        topFilter: params?.topFilter ?? '전체',
        travelStyles: params?.travelStyles,
      },
    });

    return recommendations.map(sanitizeMoodRecommendation);
  },
  getRecentMusicLogs: async () => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MusicLogItem[]>([]);
    }

    return requestApi<MusicLogItem[]>('/v1/home/recent-music-logs', {
      query: { limit: 10 },
    });
  },
};
