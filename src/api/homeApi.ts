import { isServerApiSource } from '@/api/apiSource';
import { canUseAuthenticatedApi, isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import type {
  FeaturedPlaylistMockParams,
  MoodRecommendationMockParams,
} from '@/mock-server/types';
import type {
  FeaturedPlaylist,
  MoodRecommendation,
  MusicLogItem,
} from '@/types/domain';

function shouldUseServerApi() {
  return isServerApiSource() && isRealApiEnabled();
}

export const homeApi = {
  getFeaturedPlaylists: (params?: FeaturedPlaylistMockParams) => {
    if (!shouldUseServerApi()) {
      return mockServer.home.getFeaturedPlaylists(params);
    }

    return requestApi<FeaturedPlaylist[]>('/v1/home/featured-playlists', {
      auth: false,
      query: {
        lat: params?.location?.lat,
        limit: 10,
        lng: params?.location?.lng,
        locationRecommendationEnabled: params?.locationRecommendationEnabled ?? false,
        placeId: params?.place?.id,
        recommendationMode: params?.recommendationMode ?? 'everyday',
      },
    }).catch(() => mockServer.home.getFeaturedPlaylists(params));
  },
  getMoodRecommendations: (params?: MoodRecommendationMockParams) => {
    if (!shouldUseServerApi()) {
      return mockServer.home.getMoodRecommendations(params);
    }

    return requestApi<MoodRecommendation[]>('/v1/home/mood-recommendations', {
      auth: false,
      query: {
        limit: 10,
        moodFilter: params?.moodFilter ?? '전체',
        preferredGenres: params?.preferredGenres,
        preferredMoods: params?.preferredMoods,
        recommendationMode: params?.recommendationMode ?? 'everyday',
        topFilter: params?.topFilter ?? '전체',
        travelStyles: params?.travelStyles,
      },
    }).catch(() => mockServer.home.getMoodRecommendations(params));
  },
  getRecentMusicLogs: () => {
    if (!shouldUseServerApi()) {
      return mockServer.home.getRecentMusicLogs();
    }

    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<MusicLogItem[]>([]);
    }

    return requestApi<MusicLogItem[]>('/v1/home/recent-music-logs', {
      query: { limit: 10 },
    }).catch(() => []);
  },
};
