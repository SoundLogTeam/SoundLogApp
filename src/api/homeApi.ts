import { requestApi, shouldAttemptAuthenticatedApi } from '@/api/client';
import type {
  FeaturedPlaylist,
  GeoPoint,
  MoodRecommendation,
  MusicLogItem,
  MusicRecommendationMode,
  PlaceContext,
} from '@/types/domain';
import {
  createFeaturedPlaylistsCacheKey,
  createMoodRecommendationsCacheKey,
  useRecommendationCacheStore,
} from '@/store/recommendationCacheStore';
import { sanitizeMoodRecommendation } from '@/utils/trackSanitizer';

export type FeaturedPlaylistParams = {
  location?: GeoPoint;
  locationRecommendationEnabled?: boolean;
  recommendationMode?: MusicRecommendationMode;
  place?: PlaceContext;
};

export type MoodRecommendationParams = {
  currentPlace?: PlaceContext;
  moodFilter?: string;
  recommendationMode?: MusicRecommendationMode;
  preferredGenres?: string[];
  preferredMoods?: string[];
  travelStyles?: string[];
};

export const homeApi = {
  getFeaturedPlaylists: async (params?: FeaturedPlaylistParams) => {
    const cacheKey = createFeaturedPlaylistsCacheKey(params);
    const cacheStore = useRecommendationCacheStore.getState();

    try {
      const playlists = await requestApi<FeaturedPlaylist[]>('/v1/home/featured-playlists', {
        query: {
          lat: params?.location?.lat,
          limit: 10,
          lng: params?.location?.lng,
          locationRecommendationEnabled: params?.locationRecommendationEnabled ?? false,
          placeId: params?.place?.id,
          recommendationMode: params?.recommendationMode ?? 'everyday',
        },
      });

      cacheStore.setFeaturedPlaylists(cacheKey, playlists);

      return playlists;
    } catch (error) {
      const cached = cacheStore.getFeaturedPlaylists(cacheKey);

      if (!cached) {
        throw error;
      }

      cacheStore.markFeaturedFallback(cacheKey, cached.cachedAt);

      return cached.data;
    }
  },
  getMoodRecommendations: async (params?: MoodRecommendationParams) => {
    const cacheKey = createMoodRecommendationsCacheKey(params);
    const cacheStore = useRecommendationCacheStore.getState();

    try {
      const recommendations = await requestApi<MoodRecommendation[]>('/v1/home/mood-recommendations', {
        query: {
          limit: 10,
          moodFilter: params?.moodFilter ?? '전체',
          preferredGenres: params?.preferredGenres,
          preferredMoods: params?.preferredMoods,
          recommendationMode: params?.recommendationMode ?? 'everyday',
          travelStyles: params?.travelStyles,
        },
      });
      const sanitizedRecommendations = recommendations.map(sanitizeMoodRecommendation);

      cacheStore.setMoodRecommendations(cacheKey, sanitizedRecommendations);

      return sanitizedRecommendations;
    } catch (error) {
      const cached = cacheStore.getMoodRecommendations(cacheKey);

      if (!cached) {
        throw error;
      }

      cacheStore.markMoodFallback(cacheKey, cached.cachedAt);

      return cached.data;
    }
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
