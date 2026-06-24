import {
  canUseAuthenticatedApi,
  createIdempotencyKey,
  requestApi,
} from '@/api/client';
import { RecommendationEventContext } from '@/store/recommendationEventStore';
import { Track } from '@/types/domain';

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
  playlistId?: string;
  track: Track;
};

export const libraryApi = {
  getTracks: (kind: 'all' | 'liked' | 'saved' = 'all') => {
    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<RemoteLibraryTrackRecord[]>([]);
    }

    return requestApi<RemoteLibraryTrackRecord[]>('/v1/library/tracks', {
      query: { kind, limit: 50 },
    });
  },
  updateTrackState: (
    trackId: string,
    input: {
      action: LibraryTrackAction;
      context?: RecommendationEventContext;
      playlistId?: string;
    },
  ) => {
    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<LibraryTrackState | undefined>(undefined);
    }

    return requestApi<LibraryTrackState>(`/v1/library/tracks/${encodeURIComponent(trackId)}`, {
      body: input,
      idempotencyKey: createIdempotencyKey(`library-${input.action}-${trackId}`),
      method: 'PUT',
    });
  },
};
