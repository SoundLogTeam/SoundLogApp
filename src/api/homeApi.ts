import { featuredPlaylists, moodRecommendations, recentMusicLogs } from '@/mocks/homeMocks';
import { mockDelay } from '@/api/mockDelay';

export const homeApi = {
  getFeaturedPlaylists: () => mockDelay(featuredPlaylists),
  getMoodRecommendations: (_params?: { moodFilter: string; topFilter: string }) =>
    mockDelay(moodRecommendations),
  getRecentMusicLogs: () => mockDelay(recentMusicLogs),
};
