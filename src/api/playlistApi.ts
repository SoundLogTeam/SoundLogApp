import {
  canUseAuthenticatedApi,
  createIdempotencyKey,
  requestApi,
  shouldUseServerApi,
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

export const playlistApi = {
  getPlaylist: (id?: string) => {
    if (!shouldUseServerApi()) {
      return mockServer.playlist.getPlaylist(id);
    }

    return requestApi<PlaylistCuration>(
      `/v1/playlists/${encodeURIComponent(id ?? 'fallback')}`,
    );
  },
  createContextualPlaylist: (
    input: ContextualPlaylistInput,
    fallbackPlaylistId?: string,
  ) => {
    if (!shouldUseServerApi() || !canUseAuthenticatedApi()) {
      return playlistApi.getPlaylist(fallbackPlaylistId);
    }

    return requestApi<PlaylistCuration>('/v1/playlists/contextual', {
      body: input,
      idempotencyKey: createIdempotencyKey('playlist-contextual'),
      method: 'POST',
    }).catch(() => playlistApi.getPlaylist(fallbackPlaylistId));
  },
};
