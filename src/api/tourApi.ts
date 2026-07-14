import { requestApi } from '@/api/client';
import type { GeoPoint, PlaceContext } from '@/types/domain';

type NearbyPlacesParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

type SearchPlacesParams = {
  limit?: number;
  query: string;
};

type ReverseGeocodeParams = {
  location: GeoPoint;
};

const DEFAULT_RADIUS_METERS = 2000;

export const tourApi = {
  async reverseGeocodeLocation(
    params: ReverseGeocodeParams,
  ): Promise<PlaceContext | null> {
    return requestApi<PlaceContext | null>('/v1/tour/reverse-geocode', {
      query: {
        lat: params.location.lat,
        lng: params.location.lng,
      },
    });
  },
  async searchPlaces(params: SearchPlacesParams): Promise<PlaceContext[]> {
    return requestApi<PlaceContext[]>('/v1/tour/places', {
      query: {
        limit: params.limit ?? 10,
        query: params.query.trim(),
      },
    });
  },
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    return requestApi<PlaceContext[]>('/v1/tour/nearby-places', {
      query: {
        lat: params.location.lat,
        limit: 10,
        lng: params.location.lng,
        radiusMeters: params.radiusMeters ?? DEFAULT_RADIUS_METERS,
      },
    });
  },
};
