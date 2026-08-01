import {
  createIdempotencyKey,
  getPageMeta,
  type PageMeta,
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

export type LibraryTracksPage = {
  page?: PageMeta;
  records: RemoteLibraryTrackRecord[];
};

export const libraryApi = {
  // `cursor` lets callers page past the server's default limit (50) instead
  // of silently truncating at page one — see P2-2. Existing single-page
  // callers can simply omit it.
  getTracks: async (
    kind: 'all' | 'liked' | 'saved' = 'all',
    cursor?: string,
  ): Promise<LibraryTracksPage> => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve({ records: [] });
    }

    const rawRecords = await requestApi<RemoteLibraryTrackRecord[]>('/v1/library/tracks', {
      query: { cursor, kind, limit: 50 },
    });

    return {
      page: getPageMeta(rawRecords),
      records: rawRecords.map((record) => ({
        ...record,
        track: sanitizeTrack(record.track),
      })),
    };
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
