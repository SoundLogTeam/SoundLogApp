import { RecapItem, RecapShare } from '@/types/domain';

import { getMockImageUrl } from './imageAssets';

export const recapItems: RecapItem[] = [
  {
    createdAt: '2026-05-25T00:00:00.000Z',
    id: 'seoul-night',
    placeName: 'Seoul',
    representativeTrack: {
      artist: 'JENNIE',
      fallbackColor: '#192554',
      id: 'seoul-city',
      title: 'Seoul City',
    },
    title: '서울의 밤',
    visibility: 'public',
  },
];

export const recapShare: RecapShare = {
  artistName: 'JENNIE',
  backgroundImageUrl: getMockImageUrl('seoul'),
  discImageUrl: getMockImageUrl('seoul'),
  id: 'seoul-night',
  moments: [
    {
      artistName: 'JENNIE',
      id: 'log-1',
      imageUrl: getMockImageUrl('busan'),
      location: { lat: 35.1532, lng: 129.1187 },
      placeName: '광안리',
      recordedAt: '2026-05-25T00:00:00.000Z',
      trackTitle: 'Seoul City',
    },
    {
      artistName: '아이유',
      id: 'log-2',
      imageUrl: getMockImageUrl('seoul'),
      location: { lat: 37.5294, lng: 126.9348 },
      placeName: '한강',
      recordedAt: '2026-05-25T00:10:00.000Z',
      trackTitle: '밤편지',
    },
    {
      artistName: '10cm',
      id: 'log-3',
      imageUrl: getMockImageUrl('busan'),
      location: { lat: 35.1796, lng: 129.0756 },
      placeName: '부산',
      recordedAt: '2026-05-25T00:20:00.000Z',
      trackTitle: '서울의 밤',
    },
  ],
  placeName: 'Seoul',
  recordedAt: '2024-04-24T18:20:00.000+09:00',
  trackTitle: 'Seoul City',
  visibility: 'public',
};

export const recapShareById: Record<string, RecapShare> = {
  'log-1': {
    artistName: 'JENNIE',
    backgroundImageUrl: getMockImageUrl('busan'),
    discImageUrl: getMockImageUrl('busan'),
    id: 'log-1',
    moments: [
      {
        artistName: 'JENNIE',
        id: 'log-1',
        imageUrl: getMockImageUrl('busan'),
        location: { lat: 35.1532, lng: 129.1187 },
        placeName: '광안리',
        recordedAt: '2026-05-25T00:00:00.000Z',
        trackTitle: 'Seoul City',
      },
    ],
    placeName: '광안리',
    recordedAt: '2026-05-25T00:00:00.000Z',
    trackTitle: 'Seoul City',
    visibility: 'public',
  },
  'log-2': {
    artistName: '아이유',
    backgroundImageUrl: getMockImageUrl('seoul'),
    discImageUrl: getMockImageUrl('seoul'),
    id: 'log-2',
    moments: [
      {
        artistName: '아이유',
        id: 'log-2',
        imageUrl: getMockImageUrl('seoul'),
        location: { lat: 37.5294, lng: 126.9348 },
        placeName: '한강',
        recordedAt: '2026-05-25T00:10:00.000Z',
        trackTitle: '밤편지',
      },
    ],
    placeName: '한강',
    recordedAt: '2026-05-25T00:10:00.000Z',
    trackTitle: '밤편지',
    visibility: 'public',
  },
  'log-3': {
    artistName: '10cm',
    backgroundImageUrl: getMockImageUrl('busan'),
    discImageUrl: getMockImageUrl('busan'),
    id: 'log-3',
    moments: [
      {
        artistName: '10cm',
        id: 'log-3',
        imageUrl: getMockImageUrl('busan'),
        location: { lat: 35.1796, lng: 129.0756 },
        placeName: '부산',
        recordedAt: '2026-05-25T00:20:00.000Z',
        trackTitle: '서울의 밤',
      },
    ],
    placeName: '부산',
    recordedAt: '2026-05-25T00:20:00.000Z',
    trackTitle: '서울의 밤',
    visibility: 'public',
  },
  'seoul-night': recapShare,
};
