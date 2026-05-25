import * as Location from 'expo-location';

import { GeoPoint } from '@/types/domain';

const LOCATION_TIMEOUT_MS = 4500;
type ForegroundLocationResult = {
  location?: GeoPoint;
  status: 'denied' | 'granted' | 'unavailable';
};

function timeout<T>(ms: number, value: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export async function requestForegroundLocationWithStatus(): Promise<ForegroundLocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    return { status: 'denied' };
  }

  const result = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    timeout(LOCATION_TIMEOUT_MS, undefined),
  ]);

  if (!result) {
    return { status: 'unavailable' };
  }

  return {
    location: {
      lat: result.coords.latitude,
      lng: result.coords.longitude,
    },
    status: 'granted',
  };
}

export async function getForegroundLocationWithTimeout(): Promise<GeoPoint | undefined> {
  const result = await requestForegroundLocationWithStatus();

  return result.location;
}
