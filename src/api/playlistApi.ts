import { isServerApiSource } from '@/api/apiSource';
import {
  canUseAuthenticatedApi,
  createIdempotencyKey,
  isRealApiEnabled,
  requestApi,
} from '@/api/client';
import { mockServer } from '@/mock-server';
import type { GeoPoint, MoodTag, PlaylistCuration, TravelMode } from '@/types/domain';

export type PlaylistMlMood = '감성적인' | '설레는' | '시원한' | '신나는' | '잔잔한';
export type PlaylistMlState = '바다' | '드라이브' | '산책' | '카페' | '야경';

export type ContextualPlaylistInput = {
  location?: GeoPoint;
  mood?: PlaylistMlMood;
  moodTags?: MoodTag[];
  placeId?: string;
  preferredMoods?: string[];
  state?: PlaylistMlState;
  travelMode?: TravelMode;
};

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
  createContextualPlaylist: (
    input: ContextualPlaylistInput,
    fallbackPlaylistId?: string,
  ) => {
    if (!shouldUseServerApi() || !canUseAuthenticatedApi()) {
      return mockServer.playlist.getPlaylist(fallbackPlaylistId);
    }

    return requestApi<PlaylistCuration>('/v1/playlists/contextual', {
      body: input,
      idempotencyKey: createIdempotencyKey('playlist-contextual'),
      method: 'POST',
    }).catch(() => playlistApi.getPlaylist(fallbackPlaylistId));
  },
};
