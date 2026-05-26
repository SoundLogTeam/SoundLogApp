import { mockServerDelay } from '@/mock-server/delay';
import { playlistCurationById, playlistDetail } from '@/mocks/playlistMocks';

export const playlistMockHandlers = {
  getPlaylist: (id?: string) =>
    mockServerDelay(
      'playlist.detail',
      id ? playlistCurationById[id] : playlistDetail,
    ),
};
