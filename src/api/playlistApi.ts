import { isServerApiSource } from '@/api/apiSource';
import { requestEnvelope } from '@/api/soundlogClient';
import { mockServer } from '@/mock-server';
import type { PlaylistCuration } from '@/types/domain';

export const playlistApi = {
  getPlaylist: (id?: string) =>
    isServerApiSource()
      ? requestEnvelope<PlaylistCuration>(`/v1/playlists/${id ?? 'seoul-night'}`)
      : mockServer.playlist.getPlaylist(id),
};
