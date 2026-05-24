import { FeaturedPlaylist, MoodRecommendation, MusicLogItem } from '@/types/domain';

export const featuredPlaylists: FeaturedPlaylist[] = [
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
    id: 'genre',
    title: 'Music\nGenre',
    color: '#2B176C',
    track: { artist: 'JENNIE', fallbackColor: '#192554', id: 'seoul-city', title: 'Seoul City' },
  },
  {
    id: 'drive',
    title: 'Music',
    color: '#B1913A',
    track: { artist: '김건모', fallbackColor: '#48A5B4', id: 'moon-seoul', title: '서울의 달' },
  },
  {
    id: 'city',
    title: 'and let\nthe city',
    color: '#1F2937',
    track: { artist: '폴킴', fallbackColor: '#D70D31', id: 'hangang', title: '한강에서' },
  },
];

export const recentMusicLogs: MusicLogItem[] = [
  {
    artistName: 'JENNIE',
    createdAt: '2026-05-25T00:00:00.000Z',
    id: 'log-1',
    placeName: '광안리',
    trackTitle: 'Seoul City',
  },
  {
    artistName: '아이유',
    createdAt: '2026-05-25T00:10:00.000Z',
    id: 'log-2',
    placeName: '한강',
    trackTitle: '밤편지',
  },
  {
    artistName: '10cm',
    createdAt: '2026-05-25T00:20:00.000Z',
    id: 'log-3',
    placeName: '부산',
    trackTitle: '서울의 밤',
  },
];
