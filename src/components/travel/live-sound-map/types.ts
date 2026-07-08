import type { GeoPoint, Track } from '@/types/domain';

export type SoundMapVisibility = 'companions' | 'nearby' | 'private';

export type SoundMapPinKind = 'companion' | 'me' | 'nearby';

export type SoundMapPin = {
  artistName?: string;
  id: string;
  kind: SoundMapPinKind;
  label: string;
  location: GeoPoint;
  matchScore?: number;
  subtitle: string;
  trackTitle: string;
};

export type SoundMapViewport = {
  center: GeoPoint;
  pins: SoundMapPin[];
  selectedTrack?: Track;
  sessionStatus: 'active' | 'ended' | 'idle';
  visibility: SoundMapVisibility;
};
