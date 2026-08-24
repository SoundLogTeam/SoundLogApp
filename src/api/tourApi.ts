import { requestApi } from '@/api/client';
import type { GeoPoint, PlaceContext } from '@/types/domain';
import { getTourCategoryLabel } from '@/utils/tourCategory';

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

function normalizePlace(place: PlaceContext): PlaceContext {
  return {
    ...place,
    category: getTourCategoryLabel(place.category, place.contentType),
  };
}

export const tourApi = {
  async reverseGeocodeLocation(
    params: ReverseGeocodeParams,
  ): Promise<PlaceContext | null> {
    const place = await requestApi<PlaceContext | null>('/v1/tour/reverse-geocode', {
      query: {
        lat: params.location.lat,
        lng: params.location.lng,
      },
    });

    return place ? normalizePlace(place) : null;
  },
  async searchPlaces(params: SearchPlacesParams): Promise<PlaceContext[]> {
    const places = await requestApi<PlaceContext[]>('/v1/tour/places', {
      query: {
        limit: params.limit ?? 10,
        query: params.query.trim(),
      },
    });

    return places.map(normalizePlace);
  },
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    const places = await requestApi<PlaceContext[]>('/v1/tour/nearby-places', {
      query: {
        lat: params.location.lat,
        limit: 10,
        lng: params.location.lng,
        radiusMeters: params.radiusMeters ?? DEFAULT_RADIUS_METERS,
      },
    });

    return places.map(normalizePlace);
  },
};
