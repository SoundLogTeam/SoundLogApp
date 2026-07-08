import { requestApi, shouldAttemptAuthenticatedApi } from '@/api/client';
import type { GeoPoint, TravelMode } from '@/types/domain';

export type TravelSessionDto = {
  endedAt?: string;
  id: string;
  startedAt?: string;
  status: 'active' | 'ended';
  travelMode?: TravelMode;
};

export const travelSessionApi = {
  createTravelSession: async (input: {
    location?: GeoPoint;
    startedAt?: string;
    travelMode?: TravelMode;
  }) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<TravelSessionDto>('/v1/travel-sessions', {
      body: input,
      method: 'POST',
    });
  },

  endTravelSession: async (
    sessionId: string,
    input: {
      endedAt?: string;
      location?: GeoPoint;
    } = {},
  ) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<TravelSessionDto>(`/v1/travel-sessions/${encodeURIComponent(sessionId)}`, {
      body: {
        endedAt: input.endedAt,
        location: input.location,
        status: 'ended',
      },
      method: 'PATCH',
    });
  },
};
