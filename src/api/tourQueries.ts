import { useQuery } from '@tanstack/react-query';

import { tourApi } from '@/api/tourApi';
import { GeoPoint } from '@/types/domain';

type PlaceSearchQueryParams = {
  enabled?: boolean;
  query: string;
};

export function usePlaceSearchQuery({ enabled = true, query }: PlaceSearchQueryParams) {
  const normalizedQuery = query.trim();

  return useQuery({
    enabled: enabled && normalizedQuery.length > 0,
    queryFn: () => tourApi.searchPlaces({ query: normalizedQuery }),
    queryKey: ['tour', 'place-search', normalizedQuery],
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

type NearbyPlacesQueryParams = {
  enabled: boolean;
  location?: GeoPoint;
  radiusMeters?: number;
};

export function useNearbyPlacesQuery({
  enabled,
  location,
  radiusMeters = 2000,
}: NearbyPlacesQueryParams) {
  return useQuery({
    enabled: enabled && Boolean(location),
    gcTime: 1000 * 60 * 30,
    queryFn: () =>
      tourApi.getNearbyPlaces({ location: location as GeoPoint, radiusMeters }),
    queryKey: [
      'tour',
      'nearby-places',
      {
        lat: location?.lat,
        lng: location?.lng,
        radiusMeters,
      },
    ],
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

type ReverseGeocodedPlaceQueryParams = {
  enabled: boolean;
  location?: GeoPoint;
};

export function useReverseGeocodedPlaceQuery({
  enabled,
  location,
}: ReverseGeocodedPlaceQueryParams) {
  return useQuery({
    enabled: enabled && Boolean(location),
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: () =>
      tourApi.reverseGeocodeLocation({ location: location as GeoPoint }),
    queryKey: [
      'tour',
      'reverse-geocode',
      {
        lat: location?.lat,
        lng: location?.lng,
      },
    ],
    retry: 1,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
