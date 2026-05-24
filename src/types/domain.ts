export type GeoPoint = {
  lat: number;
  lng: number;
};

export type TravelMode = 'walk' | 'drive' | 'cafe' | 'ocean' | 'festival' | 'night';

export type MoodTag = 'calm' | 'fresh' | 'emotional' | 'active' | 'local';

export type Track = {
  id: string;
  title: string;
  artist: string;
  fallbackColor?: string;
  albumImageUrl?: string;
  previewUrl?: string;
  externalUrl?: string;
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
  track: Track;
};

export type PlaylistCuration = {
  id: string;
  regionName: string;
  placeName?: string;
  reason: string;
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
};

export type RecapItem = {
  id: string;
  title: string;
  placeName: string;
  representativeTrack: Track;
  createdAt: string;
};
