import type { GeoPoint, PlaceContext, Track } from '@/types/domain';

import type { SoundMapPin, SoundMapVisibility } from './types';

const DEFAULT_CENTER: GeoPoint = {
  lat: 37.5104,
  lng: 126.9963,
};

const fallbackTrack: Track = {
  artist: 'Soundlog',
  id: 'soundlog-fallback-track',
  title: '선택한 음악 없음',
};

function offsetLocation(center: GeoPoint, latOffset: number, lngOffset: number): GeoPoint {
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset,
  };
}

export function createSoundMapCenter(location?: GeoPoint, place?: PlaceContext): GeoPoint {
  return location ?? place?.location ?? DEFAULT_CENTER;
}

export function createSoundMapPins({
  center,
  currentTrack,
  visibility,
}: {
  center: GeoPoint;
  currentTrack?: Track;
  visibility: SoundMapVisibility;
}): SoundMapPin[] {
  const selectedTrack = currentTrack ?? fallbackTrack;
  const pins: SoundMapPin[] = [
    {
      artistName: selectedTrack.artist,
      id: 'me',
      kind: 'me',
      label: '나',
      location: center,
      subtitle: 'Soundlog에서 선택한 현재 곡',
      trackTitle: selectedTrack.title,
    },
  ];

  if (visibility === 'private') {
    return pins;
  }

  pins.push({
    artistName: '수경',
    id: 'companion-su',
    kind: 'companion',
    label: '동행자',
    location: offsetLocation(center, 0.0042, 0.0038),
    subtitle: '같은 여행방 · 방금 공개',
    trackTitle: 'Coastal Drive',
  });

  if (visibility === 'nearby') {
    pins.push(
      {
        artistName: '익명 여행자',
        id: 'nearby-rainy',
        kind: 'nearby',
        label: '82%',
        location: offsetLocation(center, -0.0038, -0.0046),
        matchScore: 82,
        subtitle: '대략 위치 · 잔잔한 인디',
        trackTitle: '비 오는 골목',
      },
      {
        artistName: '익명 여행자',
        id: 'nearby-night',
        kind: 'nearby',
        label: '76%',
        location: offsetLocation(center, 0.0022, -0.006),
        matchScore: 76,
        subtitle: '대략 위치 · 야경 산책',
        trackTitle: 'City Light Walk',
      },
    );
  }

  return pins;
}
