import { isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import { PlaylistCuration } from '@/types/domain';

export const playlistApi = {
  getPlaylist: (id?: string) =>
    isRealApiEnabled()
      ? requestApi<PlaylistCuration>(`/v1/playlists/${encodeURIComponent(id ?? 'fallback')}`)
      : mockServer.playlist.getPlaylist(id),
};
