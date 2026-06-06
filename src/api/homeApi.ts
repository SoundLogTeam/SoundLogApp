import { isServerApiSource } from '@/api/apiSource';
import { requestEnvelope } from '@/api/soundlogClient';
import { mockServer } from '@/mock-server';
import type {
  FeaturedPlaylist,
  GeoPoint,
  MoodRecommendation,
  MusicLogItem,
  PlaceContext,
} from '@/types/domain';

type FeaturedPlaylistParams = {
  location?: GeoPoint;
  locationRecommendationEnabled: boolean;
  place?: PlaceContext;
  recommendationMode?: string;
};

type MoodRecommendationParams = {
  currentPlace?: PlaceContext;
  moodFilter: string;
  recommendationMode?: string;
  preferredGenres?: string[];
  preferredMoods?: string[];
  topFilter: string;
  travelStyles?: string[];
};

export const homeApi = {
  getFeaturedPlaylists: (params?: FeaturedPlaylistParams) =>
    isServerApiSource()
      ? requestEnvelope<FeaturedPlaylist[]>('/v1/home/featured-playlists', {
          query: {
            locationRecommendationEnabled:
              params?.locationRecommendationEnabled ?? true,
            lat: params?.location?.lat,
            lng: params?.location?.lng,
            placeId: params?.place?.id,
          },
        })
      : mockServer.home.getFeaturedPlaylists(params),
  getMoodRecommendations: (params?: MoodRecommendationParams) =>
    isServerApiSource()
      ? requestEnvelope<MoodRecommendation[]>('/v1/home/mood-recommendations', {
          query: {
            topFilter: params?.topFilter ?? '전체',
            moodFilter: params?.moodFilter ?? '전체',
            preferredGenres: params?.preferredGenres,
            preferredMoods: params?.preferredMoods,
            travelStyles: params?.travelStyles,
          },
        })
      : mockServer.home.getMoodRecommendations(params),
  getRecentMusicLogs: () =>
    isServerApiSource()
      ? requestEnvelope<MusicLogItem[]>('/v1/home/recent-music-logs')
      : mockServer.home.getRecentMusicLogs(),
};
