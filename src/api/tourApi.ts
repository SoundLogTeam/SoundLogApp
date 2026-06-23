import { isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import { GeoPoint, PlaceContext } from '@/types/domain';

type NearbyPlacesParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

export const tourApi = {
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    if (!isRealApiEnabled()) {
      return mockServer.tour.getNearbyPlaces(params);
    }

    return requestApi<PlaceContext[]>('/v1/tour/nearby-places', {
      auth: false,
      query: {
        lat: params.location.lat,
        limit: 10,
        lng: params.location.lng,
        radiusMeters: params.radiusMeters,
      },
    });
  },
};
