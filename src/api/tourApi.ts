import { requestApi, shouldUseServerApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import type { GeoPoint, PlaceContext } from '@/types/domain';

type NearbyPlacesParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

const DEFAULT_RADIUS_METERS = 2000;

export const tourApi = {
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    if (!shouldUseServerApi()) {
      return mockServer.tour.getNearbyPlaces(params);
    }

    return requestApi<PlaceContext[]>('/v1/tour/nearby-places', {
      auth: false,
      query: {
        lat: params.location.lat,
        limit: 10,
        lng: params.location.lng,
        radiusMeters: params.radiusMeters ?? DEFAULT_RADIUS_METERS,
      },
    });
  },
};
