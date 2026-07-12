import * as Location from 'expo-location';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { travelSessionApi } from '@/api/travelSessionApi';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { GeoPoint, RoutePoint } from '@/types/domain';

const EARTH_RADIUS_METERS = 6371000;
const MIN_ROUTE_POINT_DISTANCE_METERS = 20;
const LOCATION_WATCH_INTERVAL_MS = 15000;
const ROUTE_SYNC_DEBOUNCE_MS = 30000;
const SERVER_SESSION_ID_PREFIX = 'session_';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(first: GeoPoint, second: GeoPoint) {
  const latDistance = toRadians(second.lat - first.lat);
  const lngDistance = toRadians(second.lng - first.lng);
  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);
  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDistance / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function shouldAppendRoutePoint(previousPoint: RoutePoint | undefined, nextPoint: RoutePoint) {
  if (!previousPoint) {
    return true;
  }

  return getDistanceMeters(previousPoint, nextPoint) >= MIN_ROUTE_POINT_DISTANCE_METERS;
}

function isServerTravelSession(sessionId: string) {
  return sessionId.startsWith(SERVER_SESSION_ID_PREFIX);
}

export function createRoutePoint(location: GeoPoint, recordedAt = new Date()): RoutePoint {
  return {
    lat: location.lat,
    lng: location.lng,
    recordedAt: recordedAt.toISOString(),
  };
}

export function useTravelRouteTracking() {
  const appendRoutePoint = useTravelSessionStore((state) => state.appendRoutePoint);
  const currentLocation = useTravelSessionStore((state) => state.currentLocation);
  const setLocation = useTravelSessionStore((state) => state.setLocation);
  const setLocationStatus = useTravelSessionStore((state) => state.setLocationStatus);
  const sessionId = useTravelSessionStore((state) => state.session.id);
  const sessionStatus = useTravelSessionStore((state) => state.session.status);
  const routePoints = useTravelSessionStore((state) => state.session.routePoints ?? []);
  const lastPointRef = useRef<RoutePoint | undefined>(routePoints.at(-1));
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    lastPointRef.current = routePoints.at(-1);
  }, [routePoints]);

  const syncRouteNow = useCallback(async () => {
    if (
      Platform.OS === 'web' ||
      sessionStatus !== 'active' ||
      routePoints.length === 0 ||
      !isServerTravelSession(sessionId)
    ) {
      return;
    }

    try {
      await travelSessionApi.syncTravelSessionRoute(sessionId, {
        location: currentLocation ?? routePoints.at(-1),
        routePoints,
      });
    } catch {
      // Route points stay persisted locally and will be retried on the next foreground sync.
    }
  }, [currentLocation, routePoints, sessionId, sessionStatus]);

  useEffect(() => {
    if (
      Platform.OS === 'web' ||
      sessionStatus !== 'active' ||
      routePoints.length < 2 ||
      !isServerTravelSession(sessionId)
    ) {
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      void syncRouteNow();
    }, ROUTE_SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [routePoints.length, sessionId, sessionStatus, syncRouteNow]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void syncRouteNow();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [syncRouteNow]);

  useEffect(() => {
    if (Platform.OS === 'web' || sessionStatus !== 'active') {
      return;
    }

    let isMounted = true;
    let subscription: Location.LocationSubscription | undefined;

    async function startRouteTracking() {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMounted) {
        return;
      }

      if (!permission.granted) {
        setLocationStatus('denied');
        return;
      }

      setLocationStatus('granted');

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: MIN_ROUTE_POINT_DISTANCE_METERS,
          timeInterval: LOCATION_WATCH_INTERVAL_MS,
        },
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const nextPoint: RoutePoint = {
            ...nextLocation,
            accuracyMeters: position.coords.accuracy ?? undefined,
            recordedAt: new Date(position.timestamp).toISOString(),
          };

          setLocation(nextLocation);

          if (!shouldAppendRoutePoint(lastPointRef.current, nextPoint)) {
            return;
          }

          lastPointRef.current = nextPoint;
          appendRoutePoint(nextPoint);
        },
      );
    }

    void startRouteTracking();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [appendRoutePoint, sessionId, sessionStatus, setLocation, setLocationStatus]);
}
