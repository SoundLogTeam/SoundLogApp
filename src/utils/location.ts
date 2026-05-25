import * as Location from 'expo-location';

import { GeoPoint } from '@/types/domain';

const LOCATION_TIMEOUT_MS = 4500;

function timeout<T>(ms: number, value: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export async function getForegroundLocationWithTimeout(): Promise<GeoPoint | undefined> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    return undefined;
  }

  const result = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    timeout(LOCATION_TIMEOUT_MS, undefined),
  ]);

  if (!result) {
    return undefined;
  }

  return {
    lat: result.coords.latitude,
    lng: result.coords.longitude,
  };
}
