import { isServerApiSource } from '@/api/apiSource';
import { isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import type { PlaylistCuration } from '@/types/domain';

function shouldUseServerApi() {
  return isServerApiSource() && isRealApiEnabled();
}

export const playlistApi = {
  getPlaylist: (id?: string) => {
    if (!shouldUseServerApi()) {
      return mockServer.playlist.getPlaylist(id);
    }

    return requestApi<PlaylistCuration>(
      `/v1/playlists/${encodeURIComponent(id ?? 'fallback')}`,
    ).catch(() => mockServer.playlist.getPlaylist(id));
  },
};
