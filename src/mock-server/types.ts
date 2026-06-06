import {
  FeaturedPlaylist,
  GeoPoint,
  MusicRecommendationMode,
  MoodRecommendation,
  MusicLogItem,
  PlaceContext,
  PlaylistCuration,
  RecapItem,
  RecapShare,
} from '@/types/domain';

export type MockEndpointId =
  | 'home.featuredPlaylists'
  | 'home.moodRecommendations'
  | 'home.recentMusicLogs'
  | 'playlist.detail'
  | 'recap.list'
  | 'recap.share'
  | 'tour.nearbyPlaces';

export type MockDelayOptions = {
  delayMs?: number;
  shouldFail?: boolean;
};

export type FeaturedPlaylistMockParams = {
  location?: GeoPoint;
  locationRecommendationEnabled: boolean;
  recommendationMode: MusicRecommendationMode;
  place?: PlaceContext;
};

export type MoodRecommendationMockParams = {
  currentPlace?: PlaceContext;
  moodFilter: string;
  recommendationMode: MusicRecommendationMode;
  preferredGenres?: string[];
  preferredMoods?: string[];
  topFilter: string;
  travelStyles?: string[];
};

export type NearbyPlacesMockParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

export type MockServer = {
  home: {
    getFeaturedPlaylists: (
      params?: FeaturedPlaylistMockParams,
    ) => Promise<FeaturedPlaylist[]>;
    getMoodRecommendations: (
      params?: MoodRecommendationMockParams,
    ) => Promise<MoodRecommendation[]>;
    getRecentMusicLogs: () => Promise<MusicLogItem[]>;
  };
  playlist: {
    getPlaylist: (id?: string) => Promise<PlaylistCuration | undefined>;
  };
  recap: {
    getRecapList: () => Promise<RecapItem[]>;
    getRecapShare: (id?: string) => Promise<RecapShare | undefined>;
  };
  tour: {
    getNearbyPlaces: (
      params: NearbyPlacesMockParams,
    ) => Promise<PlaceContext[]>;
  };
};
