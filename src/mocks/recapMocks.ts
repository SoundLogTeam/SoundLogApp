import { RecapItem, RecapShare } from '@/types/domain';

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
  },
];

export const recapShare: RecapShare = {
  artistName: 'JENNIE',
  backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
  discImageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/97/4033397_image2_1.jpg',
  id: 'seoul-night',
  placeName: 'Seoul',
  recordedAt: '2024-04-24T18:20:00.000+09:00',
  trackTitle: 'Seoul City',
};

export const recapShareById: Record<string, RecapShare> = {
  'log-1': {
    artistName: 'JENNIE',
    backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
    discImageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/97/4033397_image2_1.jpg',
    id: 'log-1',
    moments: [
      {
        artistName: 'JENNIE',
        id: 'log-1',
        imageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
        placeName: '광안리',
        recordedAt: '2026-05-25T00:00:00.000Z',
        trackTitle: 'Seoul City',
      },
    ],
    placeName: '광안리',
    recordedAt: '2026-05-25T00:00:00.000Z',
    trackTitle: 'Seoul City',
  },
  'log-2': {
    artistName: '아이유',
    backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
    discImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
    id: 'log-2',
    moments: [
      {
        artistName: '아이유',
        id: 'log-2',
        imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
        placeName: '한강',
        recordedAt: '2026-05-25T00:10:00.000Z',
        trackTitle: '밤편지',
      },
    ],
    placeName: '한강',
    recordedAt: '2026-05-25T00:10:00.000Z',
    trackTitle: '밤편지',
  },
  'log-3': {
    artistName: '10cm',
    backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg',
    discImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/84/1870084.jpg',
    id: 'log-3',
    moments: [
      {
        artistName: '10cm',
        id: 'log-3',
        imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg',
        placeName: '부산',
        recordedAt: '2026-05-25T00:20:00.000Z',
        trackTitle: '서울의 밤',
      },
    ],
    placeName: '부산',
    recordedAt: '2026-05-25T00:20:00.000Z',
    trackTitle: '서울의 밤',
  },
  'seoul-night': recapShare,
};
