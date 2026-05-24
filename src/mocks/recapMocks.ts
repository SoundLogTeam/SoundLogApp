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
  'seoul-night': recapShare,
};
