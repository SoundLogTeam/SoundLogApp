import type { GeoPoint, Track } from '@/types/domain';

export type SoundMapVisibility = 'companions' | 'nearby' | 'private';

export type SoundMapPinKind =
  | 'cluster'
  | 'companion'
  | 'me'
  | 'nearby'
  | 'place';

export type SoundMapViewportMode = 'auto' | 'overview' | 'preserve';

export type SoundMapRegion = {
  latitude: number;
  latitudeDelta: number;
  longitude: number;
  longitudeDelta: number;
};

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

export type SoundMapViewportSize = {
  height: number;
  width: number;
};

export type SoundMapViewport = {
  center: GeoPoint;
  currentLocation?: GeoPoint;
  fullBleed?: boolean;
  height?: number;
  legendItems?: Array<{
    color: string;
    label: string;
  }>;
  onPinPress?: (pin: SoundMapPin) => void;
  onRegionChangeComplete?: (region: SoundMapRegion) => void;
  onViewportLayoutChange?: (size: SoundMapViewportSize) => void;
  pins: SoundMapPin[];
  selectedPinId?: string;
  selectedTrack?: Track;
  showChrome?: boolean;
  showPinCallouts?: boolean;
  sessionStatus: 'active' | 'ended' | 'idle';
  statusLabel?: string;
  visibility: SoundMapVisibility;
  viewportKey?: string;
  viewportMode?: SoundMapViewportMode;
};

export type SoundMapViewHandle = {
  focusCurrentLocation: () => void;
};
