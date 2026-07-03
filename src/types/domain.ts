export type GeoPoint = {
  lat: number;
  lng: number;
};

export type PlaceContext = {
  address?: string;
  category?: string;
  contentType?: string;
  distanceMeters?: number;
  id: string;
  imageUrl?: string;
  location?: GeoPoint;
  overview?: string;
  source: 'seed' | 'tour-api';
  title: string;
};

export type TravelMode = 'walk' | 'drive' | 'cafe' | 'ocean' | 'festival' | 'night';

export type MusicRecommendationMode = 'everyday' | 'travel';

export type MoodTag = 'calm' | 'fresh' | 'emotional' | 'active' | 'local';

export type MusicPlatformId = 'none' | 'youtubeMusic';

export type ExternalMusicPlatformId = 'melon' | 'youtubeMusic';

export type Track = {
  id: string;
  title: string;
  artist: string;
  fallbackColor?: string;
  albumImageUrl?: string;
  previewUrl?: string;
  externalUrl?: string;
  platformUrls?: Partial<Record<ExternalMusicPlatformId, string>>;
  isLiked?: boolean;
  isSaved?: boolean;
};

export type FeaturedPlaylist = {
  id: string;
  regionName: string;
  description: string;
  trackCount: number;
  durationText: string;
};

export type MoodRecommendation = {
  id: string;
  title: string;
  subtitle?: string;
  color: string;
  genres?: string[];
  moods?: string[];
  playlistId?: string;
  track: Track;
  travelStyles?: string[];
};

export type PlaylistCuration = {
  id: string;
  regionName: string;
  placeName?: string;
  reason: string;
  accentColor?: string;
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  trackCount: number;
  durationText: string;
  tracks: Track[];
};

export type MusicLogItem = {
  id: string;
  placeName: string;
  trackTitle: string;
  artistName: string;
  createdAt: string;
  imageUrl?: string;
  recapShareId?: string;
};

export type MomentLog = {
  id: string;
  photoUri: string;
  createdAt: string;
  sessionId?: string;
  location?: GeoPoint;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  track?: Track;
  travelMode?: TravelMode;
  moodTags: MoodTag[];
  source: 'camera';
  syncStatus: 'failed' | 'local' | 'pending' | 'synced';
};

export type RecapItem = {
  id: string;
  title: string;
  placeName: string;
  representativeTrack: Track;
  createdAt: string;
  momentCount?: number;
  sessionId?: string;
};

export type RecapTemplateId = 'album' | 'film' | 'lp';

export type RecapShareMoment = {
  id: string;
  imageUrl?: string;
  placeName: string;
  trackTitle: string;
  artistName: string;
  recordedAt: string;
};

export type RecapShare = {
  id: string;
  placeName: string;
  trackTitle: string;
  artistName: string;
  backgroundImageUrl?: string;
  discImageUrl?: string;
  moments?: RecapShareMoment[];
  recordedAt: string;
  shareImageUrl?: string;
};
