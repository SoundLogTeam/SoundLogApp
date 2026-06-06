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

const geojeTracks: Track[] = [
  {
    artist: 'AKMU',
    fallbackColor: '#1D7F8C',
    id: 'geoje-dinosaur-ridge',
    platformUrls: {
      melon:
        'https://www.melon.com/search/total/index.htm?q=AKMU%20Dinosaur',
      spotify: 'https://open.spotify.com/search/AKMU%20Dinosaur',
      youtubeMusic: 'https://music.youtube.com/search?q=AKMU%20Dinosaur',
    },
    title: 'Dinosaur',
  },
  {
    artist: '볼빨간사춘기',
    fallbackColor: '#E66A73',
    id: 'geoje-travel',
    platformUrls: {
      melon:
        'https://www.melon.com/search/total/index.htm?q=%EB%B3%BC%EB%B9%A8%EA%B0%84%EC%82%AC%EC%B6%98%EA%B8%B0%20%EC%97%AC%ED%96%89',
      spotify:
        'https://open.spotify.com/search/%EB%B3%BC%EB%B9%A8%EA%B0%84%EC%82%AC%EC%B6%98%EA%B8%B0%20%EC%97%AC%ED%96%89',
      youtubeMusic:
        'https://music.youtube.com/search?q=%EB%B3%BC%EB%B9%A8%EA%B0%84%EC%82%AC%EC%B6%98%EA%B8%B0%20%EC%97%AC%ED%96%89',
    },
    title: '여행',
  },
  {
    artist: '잔나비',
    fallbackColor: '#D29B42',
    id: 'geoje-summer',
    platformUrls: {
      spotify:
        'https://open.spotify.com/search/%EC%9E%94%EB%82%98%EB%B9%84%20%EB%9C%A8%EA%B1%B0%EC%9A%B4%20%EC%97%AC%EB%A6%84%EB%B0%A4%EC%9D%80%20%EA%B0%80%EA%B3%A0%20%EB%82%A8%EC%9D%80%20%EA%B1%B4%20%EB%B3%BC%ED%92%88%EC%97%86%EC%A7%80%EB%A7%8C',
      youtubeMusic:
        'https://music.youtube.com/search?q=%EC%9E%94%EB%82%98%EB%B9%84%20%EB%9C%A8%EA%B1%B0%EC%9A%B4%20%EC%97%AC%EB%A6%84%EB%B0%A4%EC%9D%80%20%EA%B0%80%EA%B3%A0%20%EB%82%A8%EC%9D%80%20%EA%B1%B4%20%EB%B3%BC%ED%92%88%EC%97%86%EC%A7%80%EB%A7%8C',
    },
    title: '뜨거운 여름밤은 가고 남은 건 볼품없지만',
  },
  {
    artist: 'wave to earth',
    fallbackColor: '#2D6A72',
    id: 'geoje-seasons',
    platformUrls: {
      spotify: 'https://open.spotify.com/search/wave%20to%20earth%20seasons',
      youtubeMusic: 'https://music.youtube.com/search?q=wave%20to%20earth%20seasons',
    },
    title: 'seasons',
  },
  {
    artist: '혁오',
    fallbackColor: '#45536B',
    id: 'geoje-wi-ing',
    platformUrls: {
      spotify: 'https://open.spotify.com/search/hyukoh%20wi%20ing%20wi%20ing',
      youtubeMusic: 'https://music.youtube.com/search?q=hyukoh%20wi%20ing%20wi%20ing',
    },
    title: '위잉위잉',
  },
  {
    artist: '오존',
    fallbackColor: '#6C7F99',
    id: 'geoje-down',
    platformUrls: {
      spotify: 'https://open.spotify.com/search/O3ohn%20Down',
      youtubeMusic: 'https://music.youtube.com/search?q=O3ohn%20Down',
    },
    title: 'Down',
  },
  {
    artist: '카더가든',
    fallbackColor: '#334D3F',
    id: 'geoje-tree',
    platformUrls: {
      spotify:
        'https://open.spotify.com/search/%EC%B9%B4%EB%8D%94%EA%B0%80%EB%93%A0%20%EB%82%98%EB%AC%B4',
      youtubeMusic:
        'https://music.youtube.com/search?q=%EC%B9%B4%EB%8D%94%EA%B0%80%EB%93%A0%20%EB%82%98%EB%AC%B4',
    },
    title: '나무',
  },
  {
    artist: 'The Black Skirts',
    fallbackColor: '#1F2937',
    id: 'geoje-everything',
    platformUrls: {
      spotify: 'https://open.spotify.com/search/The%20Black%20Skirts%20Everything',
      youtubeMusic:
        'https://music.youtube.com/search?q=The%20Black%20Skirts%20Everything',
    },
    title: 'Everything',
  },
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
  'geoje-ocean': {
    backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg',
    coverImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
    durationText: '32:00분',
    id: 'geoje-ocean',
    placeName: '바람의 언덕과 해안도로',
    reason: '거제의 바다 바람과 섬길 드라이브에 어울리는 음악이에요',
    regionName: '거제',
    trackCount: geojeTracks.length,
    tracks: geojeTracks,
  },
  'busan-ocean': {
    ...playlistDetail,
    backgroundImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
    coverImageUrl: 'https://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
    durationText: '40:00분',
    id: 'busan-ocean',
    placeName: '광안리 해변',
    reason: '부산 해변 산책과 어울리는 음악이에요',
    regionName: '부산',
    trackCount: 12,
  },
  'seoul-night': playlistDetail,
};
