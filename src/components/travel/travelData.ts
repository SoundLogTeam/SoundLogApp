import type { MomentLog, MoodTag, TravelMode } from '@/types/domain';

export type TravelModeOption = {
  icon: string;
  label: string;
  value: TravelMode;
};

export type TravelRecap = {
  date: string;
  durationText: string;
  id: string;
  locations: string[];
  mode: TravelMode;
  momentCount: number;
  periodText: string;
  playCount: number;
  playTimeText: string;
  representativeTrack: string;
  topTracks: Array<{
    artist: string;
    playCount: number;
    title: string;
  }>;
  trackCount: number;
  uniqueTracks: string[];
};

export const travelModeOptions: TravelModeOption[] = [
  { icon: '🚶', label: '산책', value: 'walk' },
  { icon: '🚗', label: '드라이브', value: 'drive' },
  { icon: '☕', label: '카페 투어', value: 'cafe' },
  { icon: '🌊', label: '바다 보기', value: 'ocean' },
  { icon: '🌙', label: '야경 감상', value: 'night' },
];

export const modeLabelByValue = travelModeOptions.reduce(
  (acc, mode) => ({
    ...acc,
    [mode.value]: mode.label,
  }),
  {} as Record<TravelMode, string>,
);

export const modeIconByValue = travelModeOptions.reduce(
  (acc, mode) => ({
    ...acc,
    [mode.value]: mode.icon,
  }),
  {} as Record<TravelMode, string>,
);

export const moodLabelByValue: Record<MoodTag, string> = {
  active: '신나는',
  calm: '잔잔한',
  emotional: '감성적인',
  fresh: '시원한',
  local: '설레는',
};

export const sampleMoments: MomentLog[] = [
  {
    createdAt: '2026-06-06T17:21:00.000+09:00',
    id: 'sample-gwangalli',
    moodTags: ['fresh'],
    photoUri: 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg',
    placeName: '광안리 해변',
    source: 'camera',
    syncStatus: 'synced',
    track: {
      artist: 'NewJeans',
      fallbackColor: '#7DD3FC',
      id: 'ditto',
      title: 'Ditto',
    },
    travelMode: 'ocean',
  },
  {
    createdAt: '2026-06-06T15:42:00.000+09:00',
    id: 'sample-seongsu',
    moodTags: ['calm', 'local'],
    photoUri: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
    placeName: '성수 카페거리',
    source: 'camera',
    syncStatus: 'synced',
    track: {
      artist: 'IU',
      fallbackColor: '#FBBF24',
      id: 'love-wins-all',
      title: 'Love wins all',
    },
    travelMode: 'cafe',
  },
  {
    createdAt: '2026-06-06T13:18:00.000+09:00',
    id: 'sample-night',
    moodTags: ['emotional'],
    photoUri: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
    placeName: '남산 산책로',
    source: 'camera',
    syncStatus: 'synced',
    track: {
      artist: '10CM',
      fallbackColor: '#C084FC',
      id: 'spring-snow',
      title: '봄눈',
    },
    travelMode: 'walk',
  },
];

export const sampleRecaps: TravelRecap[] = [
  {
    date: '2026.06.06',
    durationText: '2시간 14분의 여행',
    id: 'seoul-night',
    locations: ['성수 카페거리', '서울숲 입구', '뚝섬 전망대'],
    mode: 'cafe',
    momentCount: 12,
    periodText: '2026.06.06 13:02 - 15:16',
    playCount: 48,
    playTimeText: '음악 기록 31곡',
    representativeTrack: 'IU - Love wins all',
    topTracks: [
      { artist: 'IU', playCount: 9, title: 'Love wins all' },
      { artist: 'NewJeans', playCount: 7, title: 'Ditto' },
      { artist: 'NewJeans', playCount: 6, title: 'ETA' },
      { artist: 'IU', playCount: 5, title: 'Blueming' },
      { artist: 'NewJeans', playCount: 4, title: 'Attention' },
    ],
    trackCount: 31,
    uniqueTracks: ['Love wins all', 'Ditto', 'ETA', 'Blueming', 'Attention', '밤편지'],
  },
  {
    date: '2026.05.25',
    durationText: '1시간 48분의 여행',
    id: 'log-3',
    locations: ['광안리 해변', '민락수변공원', '광안대교 전망'],
    mode: 'ocean',
    momentCount: 8,
    periodText: '2026.05.25 16:41 - 18:29',
    playCount: 36,
    playTimeText: '음악 기록 24곡',
    representativeTrack: 'NewJeans - Ditto',
    topTracks: [
      { artist: 'NewJeans', playCount: 8, title: 'Ditto' },
      { artist: 'NewJeans', playCount: 6, title: 'Attention' },
      { artist: 'NewJeans', playCount: 5, title: 'ETA' },
      { artist: 'AKMU', playCount: 4, title: 'DINOSAUR' },
      { artist: '10CM', playCount: 3, title: '봄눈' },
    ],
    trackCount: 24,
    uniqueTracks: ['Ditto', 'Attention', 'ETA', 'DINOSAUR', '봄눈', 'Seoul City'],
  },
  {
    date: '2026.05.11',
    durationText: '3시간 02분의 여행',
    id: 'log-2',
    locations: ['남산 산책로', '해방촌', '서울 야경 전망대'],
    mode: 'night',
    momentCount: 15,
    periodText: '2026.05.11 19:08 - 22:10',
    playCount: 64,
    playTimeText: '음악 기록 42곡',
    representativeTrack: 'JENNIE - Seoul City',
    topTracks: [
      { artist: 'JENNIE', playCount: 11, title: 'Seoul City' },
      { artist: '10CM', playCount: 8, title: '봄눈' },
      { artist: 'IU', playCount: 7, title: '밤편지' },
      { artist: 'Crush', playCount: 6, title: 'Beautiful' },
      { artist: 'NewJeans', playCount: 5, title: 'Cool With You' },
    ],
    trackCount: 42,
    uniqueTracks: ['Seoul City', '봄눈', '밤편지', 'Beautiful', 'Cool With You', '그라데이션'],
  },
];
