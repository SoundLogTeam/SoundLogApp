import { mockDelay } from '@/api/mockDelay';
import { playlistCurationById, playlistDetail } from '@/mocks/playlistMocks';

export const playlistApi = {
  getPlaylist: (id?: string) => mockDelay(playlistCurationById[id ?? ''] ?? playlistDetail),
};
