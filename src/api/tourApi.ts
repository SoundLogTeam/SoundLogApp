import { isServerApiSource } from '@/api/apiSource';
import { requestEnvelope } from '@/api/soundlogClient';
import { mockServer } from '@/mock-server';
import { GeoPoint, PlaceContext } from '@/types/domain';

type NearbyPlacesParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

const DEFAULT_RADIUS_METERS = 2000;

export const tourApi = {
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    return isServerApiSource()
      ? requestEnvelope<PlaceContext[]>('/v1/tour/nearby-places', {
          auth: false,
          query: {
            lat: params.location.lat,
            lng: params.location.lng,
            radiusMeters: params.radiusMeters ?? DEFAULT_RADIUS_METERS,
          },
        })
      : mockServer.tour.getNearbyPlaces(params);
  },
};
