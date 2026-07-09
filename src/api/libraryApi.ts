import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
} from '@/api/client';
import { RecommendationEventContext } from '@/store/recommendationEventStore';
import { LibraryPlaylistSummary, Track } from '@/types/domain';
import { sanitizeTrack } from '@/utils/trackSanitizer';

type LibraryTrackAction = 'like' | 'save' | 'unlike' | 'unsave';

type LibraryTrackState = {
  isLiked: boolean;
  isSaved: boolean;
  trackId: string;
  updatedAt: string;
};

export type RemoteLibraryTrackRecord = {
  createdAt: string;
  id: string;
  kind: 'liked' | 'saved';
  playlist?: LibraryPlaylistSummary;
  playlistId?: string;
  track: Track;
};

export const libraryApi = {
  getTracks: async (kind: 'all' | 'liked' | 'saved' = 'all') => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RemoteLibraryTrackRecord[]>([]);
    }

    const records = await requestApi<RemoteLibraryTrackRecord[]>('/v1/library/tracks', {
      query: { kind, limit: 50 },
    });

    return records.map((record) => ({
      ...record,
      track: sanitizeTrack(record.track),
    }));
  },
  updateTrackState: (
    trackId: string,
    input: {
      action: LibraryTrackAction;
      context?: RecommendationEventContext;
      playlistId?: string;
    },
  ) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<LibraryTrackState | undefined>(undefined);
    }

    return requestApi<LibraryTrackState>(`/v1/library/tracks/${encodeURIComponent(trackId)}`, {
      body: input,
      idempotencyKey: createIdempotencyKey(`library-${input.action}-${trackId}`),
      method: 'PUT',
    });
  },
};
