import { FeaturedPlaylist, MoodRecommendation, MusicLogItem } from '@/types/domain';

export const featuredPlaylists: FeaturedPlaylist[] = [
  {
    id: 'geoje-ocean',
    regionName: '거제',
    description: '거제 바다와 섬길을 따라 듣기 좋은 플레이리스트예요.',
    durationText: '32:00분',
    trackCount: 8,
  },
  {
    id: 'busan-ocean',
    regionName: '부산',
    description: '부산광역시에 어울리는 노래를 추천해드립니다.',
    durationText: '40:00분',
    trackCount: 12,
  },
  {
    id: 'seoul-night',
    regionName: '서울',
    description: '서울 야경과 어울리는 음악을 모았어요.',
    durationText: '36:00분',
    trackCount: 10,
  },
];

export const moodRecommendations: MoodRecommendation[] = [
  {
    id: 'calm-walk',
    title: '잔잔한\n산책',
    color: '#2B176C',
    genres: ['인디', '발라드'],
    moods: ['잔잔한', '감성적인'],
    track: { artist: 'JENNIE', fallbackColor: '#192554', id: 'seoul-city', title: 'Seoul City' },
    travelStyles: ['산책', '야경 감상'],
  },
  {
    id: 'drive',
    title: '드라이브\n팝',
    color: '#B1913A',
    genres: ['팝', 'K-POP'],
    moods: ['신나는', '청량한', '활기찬'],
    track: { artist: '김건모', fallbackColor: '#48A5B4', id: 'moon-seoul', title: '서울의 달' },
    travelStyles: ['드라이브', '바다 보기'],
  },
  {
    id: 'city-night',
    title: '도시의\n야경',
    color: '#1F2937',
    genres: ['R&B', 'OST'],
    moods: ['감성적인', '잔잔한'],
    track: { artist: '폴킴', fallbackColor: '#D70D31', id: 'hangang', title: '한강에서' },
    travelStyles: ['야경 감상', '카페 투어'],
  },
  {
    id: 'cafe-indie',
    title: '카페\n인디',
    color: '#3F2C6B',
    genres: ['인디', 'R&B'],
    moods: ['잔잔한', '청량한'],
    track: { artist: '10cm', fallbackColor: '#814D2B', id: 'cafe-night', title: '카페의 밤' },
    travelStyles: ['카페 투어', '산책'],
  },
  {
    id: 'festival-kpop',
    title: '페스티벌\nK-POP',
    color: '#9A3E62',
    genres: ['K-POP', '힙합'],
    moods: ['신나는', '활기찬'],
    track: { artist: 'NewJeans', fallbackColor: '#29376B', id: 'festival-air', title: 'Festival Air' },
    travelStyles: ['축제'],
  },
];

export const recentMusicLogs: MusicLogItem[] = [
  {
    artistName: 'JENNIE',
    createdAt: '2026-05-25T00:00:00.000Z',
    id: 'log-1',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
    placeName: '광안리',
    recapShareId: 'log-1',
    trackTitle: 'Seoul City',
  },
  {
    artistName: '아이유',
    createdAt: '2026-05-25T00:10:00.000Z',
    id: 'log-2',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
    placeName: '한강',
    recapShareId: 'log-2',
    trackTitle: '밤편지',
  },
  {
    artistName: '10cm',
    createdAt: '2026-05-25T00:20:00.000Z',
    id: 'log-3',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg',
    placeName: '부산',
    recapShareId: 'log-3',
    trackTitle: '서울의 밤',
  },
];
