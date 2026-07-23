import { requestApi, shouldAttemptAuthenticatedApi } from '@/api/client';
import type { GeoPoint, RoutePoint, TravelMode } from '@/types/domain';

export type TravelSessionDto = {
  endedAt?: string;
  id: string;
  routePoints?: RoutePoint[];
  startedAt?: string;
  status: 'active' | 'ended';
  travelMode?: TravelMode;
};

export const travelSessionApi = {
  createTravelSession: async (input: {
    location?: GeoPoint;
    routePoints?: RoutePoint[];
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
      routePoints?: RoutePoint[];
    } = {},
  ) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<TravelSessionDto>(`/v1/travel-sessions/${encodeURIComponent(sessionId)}`, {
      body: {
        endedAt: input.endedAt,
        location: input.location,
        routePoints: input.routePoints,
        status: 'ended',
      },
      method: 'PATCH',
    });
  },

  syncTravelSessionRoute: async (
    sessionId: string,
    input: {
      location?: GeoPoint;
      routePoints: RoutePoint[];
    },
  ) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<TravelSessionDto>(`/v1/travel-sessions/${encodeURIComponent(sessionId)}`, {
      body: {
        location: input.location,
        routePoints: input.routePoints,
        status: 'active',
      },
      method: 'PATCH',
    });
  },

  updateTravelMode: async (sessionId: string, travelMode: TravelMode) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<TravelSessionDto>(`/v1/travel-sessions/${encodeURIComponent(sessionId)}`, {
      body: {
        status: 'active',
        travelMode,
      },
      method: 'PATCH',
    });
  },
};
