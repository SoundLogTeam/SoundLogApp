import { requestApi, shouldUseServerApi } from '@/api/client';
import { getMockServer } from '@/api/mockServerClient';
import type { GeoPoint, PlaceContext } from '@/types/domain';

type NearbyPlacesParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

const DEFAULT_RADIUS_METERS = 2000;

export const tourApi = {
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    if (!shouldUseServerApi()) {
      const mockServer = await getMockServer();
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
