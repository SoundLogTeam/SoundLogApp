import {
  canUseAuthenticatedApi,
  createIdempotencyKey,
  requestApi,
} from '@/api/client';
import { RecommendationEventContext } from '@/store/recommendationEventStore';

type LibraryTrackAction = 'like' | 'save' | 'unlike' | 'unsave';

type LibraryTrackState = {
  isLiked: boolean;
  isSaved: boolean;
  trackId: string;
  updatedAt: string;
};

export const libraryApi = {
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
