import { isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import { PlaylistCuration } from '@/types/domain';

export const playlistApi = {
  getPlaylist: (id?: string) => {
    if (!isRealApiEnabled()) {
      return mockServer.playlist.getPlaylist(id);
    }

    return requestApi<PlaylistCuration>(
      `/v1/playlists/${encodeURIComponent(id ?? 'fallback')}`,
    ).catch(() => mockServer.playlist.getPlaylist(id));
  },
};
