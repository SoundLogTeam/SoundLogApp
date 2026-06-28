import {
  AuthMe,
  AuthSession,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  SocialLoginRequest,
} from '@/types/auth';
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
  RecapTemplateId,
} from '@/types/domain';

export type MockEndpointId =
  | 'auth.logout'
  | 'auth.me'
  | 'auth.migrateLocalData'
  | 'auth.refresh'
  | 'auth.socialLogin'
  | 'home.featuredPlaylists'
  | 'home.moodRecommendations'
  | 'home.recentMusicLogs'
  | 'playlist.detail'
  | 'recap.create'
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
  auth: {
    getMe: () => Promise<AuthMe>;
    logout: () => Promise<{ accepted: boolean }>;
    migrateLocalData: (
      payload: LocalDataMigrationPayload,
    ) => Promise<LocalDataMigrationResult>;
    refresh: (refreshToken?: string) => Promise<AuthSession>;
    socialLogin: (request: SocialLoginRequest) => Promise<AuthSession>;
  };
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
    createShareEvent: (
      recapId: string,
      type: 'os_share' | 'save_image',
    ) => Promise<{ accepted: boolean }>;
    createRecap: (input: {
      momentLogIds?: string[];
      representativeTrackId?: string;
      sessionId?: string;
      templateId: RecapTemplateId | 'video';
      title?: string;
    }) => Promise<RecapItem | undefined>;
    getRecapList: () => Promise<RecapItem[]>;
    getRecapShare: (id?: string) => Promise<RecapShare | undefined>;
  };
  tour: {
    getNearbyPlaces: (
      params: NearbyPlacesMockParams,
    ) => Promise<PlaceContext[]>;
  };
};
