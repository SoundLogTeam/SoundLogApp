import type {
  GeoPoint,
  MusicMatch,
  PlaceContext,
  SoundMapPin as DomainSoundMapPin,
  Track,
  TravelMode,
} from '@/types/domain';

import type { SoundMapPin, SoundMapVisibility } from './types';

const DEFAULT_CENTER: GeoPoint = {
  lat: 37.5104,
  lng: 126.9963,
};

const fallbackTrack: Track = {
  artist: '아티스트',
  id: 'soundlog-fallback-track',
  title: '곡명 A',
};

const travelModeLabelByValue: Partial<Record<TravelMode, string>> = {
  cafe: '카페',
  drive: '드라이브',
  night: '야경',
  ocean: '바다',
  walk: '산책',
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

function createFallbackSoundMapPin({
  center,
  id,
  index,
  matchMood,
  placeName,
  title,
  track,
}: {
  center: GeoPoint;
  id: string;
  index: number;
  matchMood: string;
  placeName: string;
  title: string;
  track: Track;
}): DomainSoundMapPin {
  const offsets = [
    { lat: -0.0038, lng: -0.0046 },
    { lat: 0.0022, lng: -0.006 },
  ];
  const offset = offsets[index] ?? offsets[0];

  return {
    alias: title,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    id,
    isMine: false,
    location: offsetLocation(center, offset.lat, offset.lng),
    moodTags: [],
    placeName,
    profile: {
      preferredGenres: index === 0 ? ['인디'] : ['시티팝'],
      preferredMoods: index === 0 ? ['잔잔한', matchMood] : ['설레는', matchMood],
      travelStyles: index === 0 ? ['혼자 여행'] : ['사진 산책'],
    },
    track,
    updatedAt: new Date().toISOString(),
    visibility: 'nearby',
  };
}

export function createFallbackMusicMatches({
  center,
  currentTrack,
  place,
  selectedMode,
}: {
  center: GeoPoint;
  currentTrack?: Track;
  place?: PlaceContext;
  selectedMode?: TravelMode;
}): MusicMatch[] {
  const matchMood = selectedMode ? travelModeLabelByValue[selectedMode] ?? '산책' : '산책';
  const firstTrack: Track = currentTrack ?? {
    artist: '아티스트',
    fallbackColor: '#2B176C',
    id: 'fallback-match-track-rainy',
    title: '곡명 C',
  };
  const secondTrack: Track = {
    artist: 'City Sound',
    fallbackColor: '#9EA8FF',
    id: 'fallback-match-track-night',
    title: 'City Light Walk',
  };
  const placeName = place?.title ?? '성수 근처';
  const firstPin = createFallbackSoundMapPin({
    center,
    id: 'nearby-rainy',
    index: 0,
    matchMood,
    placeName,
    title: '비 오는 골목 닉네임',
    track: firstTrack,
  });
  const secondPin = createFallbackSoundMapPin({
    center,
    id: 'nearby-night',
    index: 1,
    matchMood,
    placeName: '대략 위치 공개',
    title: '야경 수집가',
    track: secondTrack,
  });

  return [
    {
      id: 'fallback-match-rainy',
      matchScore: 82,
      pin: firstPin,
      safety: {
        contactHiddenUntilAccepted: true,
        exactLocationHidden: true,
        firstMessageTemplates: ['liked_track', 'walk_together'],
      },
      targetPinId: firstPin.id,
    },
    {
      id: 'fallback-match-night',
      matchScore: 76,
      pin: secondPin,
      safety: {
        contactHiddenUntilAccepted: true,
        exactLocationHidden: true,
        firstMessageTemplates: ['cafe_together', 'liked_track'],
      },
      targetPinId: secondPin.id,
    },
  ];
}
