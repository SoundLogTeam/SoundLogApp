import {
  ApiError,
  createIdempotencyKey,
  requestApi,
} from '@/api/client';
import type {
  GeoPoint,
  MoodTag,
  PlaylistCuration,
  PlaylistRecommendationSource,
  TravelMode,
} from '@/types/domain';
import { sanitizePlaylistCuration } from '@/utils/trackSanitizer';

export type PlaylistMlMood = '감성적인' | '설레는' | '시원한' | '신나는' | '잔잔한';
export type PlaylistMlState = '바다' | '드라이브' | '산책' | '카페' | '야경';

export type ContextualPlaylistInput = {
  location?: GeoPoint;
  mood?: PlaylistMlMood;
  moodTags?: MoodTag[];
  placeId?: string;
  preferredGenres?: string[];
  preferredMoods?: string[];
  state?: PlaylistMlState;
  travelMode?: TravelMode;
};

export type RecommendedPlaylistInput = {
  location: GeoPoint;
  mood: PlaylistMlMood;
  state: PlaylistMlState;
};

function withRecommendationSource(
  playlist: PlaylistCuration,
  source: PlaylistRecommendationSource,
) {
  if (playlist.context?.source) {
    return playlist;
  }

  return {
    ...playlist,
    context: {
      ...playlist.context,
      source,
    },
  };
}

export const playlistApi = {
  getPlaylist: async (id?: string) => {
    const playlist = await requestApi<PlaylistCuration>(
      `/v1/playlists/${encodeURIComponent(id ?? 'fallback')}`,
    );

    return sanitizePlaylistCuration(playlist);
  },
  getRecommendedPlaylist: async (input: ContextualPlaylistInput) => {
    if (!input.location) {
      const playlist = await playlistApi.createContextualPlaylist(input);

      return withRecommendationSource(playlist, 'seed-fallback');
    }

    try {
      const playlist = await requestApi<PlaylistCuration>('/v1/recommendations/playlists', {
        query: {
          mood: input.mood ?? '잔잔한',
          state: input.state ?? '산책',
          x: input.location.lng,
          y: input.location.lat,
        },
      });

      return sanitizePlaylistCuration(playlist);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw error;
      }

      const playlist = await playlistApi.createContextualPlaylist(input);

      return withRecommendationSource(playlist, 'seed-fallback');
    }
  },
  createContextualPlaylist: async (input: ContextualPlaylistInput) => {
    const playlist = await requestApi<PlaylistCuration>('/v1/playlists/contextual', {
      body: input,
      idempotencyKey: createIdempotencyKey('playlist-contextual'),
      method: 'POST',
    });

    return withRecommendationSource(sanitizePlaylistCuration(playlist), 'server-contextual');
  },
};
