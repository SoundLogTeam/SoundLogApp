import { useQuery } from '@tanstack/react-query';

import { tourApi } from '@/api/tourApi';
import { GeoPoint } from '@/types/domain';

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
    queryFn: () => tourApi.getNearbyPlaces({ location: location as GeoPoint, radiusMeters }),
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
