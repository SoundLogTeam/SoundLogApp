import { PlaylistCuration, Track } from '@/types/domain';

const tracks: Track[] = [
  {
    artist: 'JENNIE',
    externalUrl: 'https://music.youtube.com/search?q=JENNIE%20Seoul%20City',
    fallbackColor: '#192554',
    id: 'seoul-city',
    isLiked: true,
    platformUrls: {
      spotify: 'https://open.spotify.com/search/JENNIE%20Seoul%20City',
      youtubeMusic: 'https://music.youtube.com/search?q=JENNIE%20Seoul%20City',
    },
    title: 'Seoul City',
  },
  {
    artist: '김건모',
    fallbackColor: '#48A5B4',
    id: 'moon-seoul',
    platformUrls: {
      melon: 'https://www.melon.com/search/total/index.htm?q=%EA%B9%80%EA%B1%B4%EB%AA%A8%20%EC%84%9C%EC%9A%B8%EC%9D%98%20%EB%8B%AC',
    },
    title: '서울의 달',
  },
  {
    artist: '폴킴',
    fallbackColor: '#D70D31',
    id: 'hangang',
    isSaved: true,
    title: '한강에서',
  },
  { artist: '아이유', fallbackColor: '#F3B015', id: 'night-letter', title: '밤편지' },
  { artist: '기리보이', fallbackColor: '#526391', id: 'hongdae-kondae', title: '홍대와 건대사이' },
  { artist: '10cm', fallbackColor: '#DA6C51', id: 'seoul-night-track', title: '서울의 밤' },
];

export const playlistDetail: PlaylistCuration = {
  backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
  coverImageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/97/4033397_image2_1.jpg',
  durationText: '36:00분',
  id: 'seoul-night',
  placeName: '서울 야경',
  reason: '현재 위치를 바탕으로 추천했어요',
  regionName: 'Seoul',
  trackCount: tracks.length,
  tracks,
};

export const playlistCurationById: Record<string, PlaylistCuration> = {
  'busan-ocean': {
    ...playlistDetail,
    backgroundImageUrl: 'http://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
    coverImageUrl: 'http://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
    durationText: '40:00분',
    id: 'busan-ocean',
    placeName: '광안리 해변',
    reason: '부산 해변 산책과 어울리는 음악이에요',
    regionName: '부산',
    trackCount: 12,
  },
  'seoul-night': playlistDetail,
};
