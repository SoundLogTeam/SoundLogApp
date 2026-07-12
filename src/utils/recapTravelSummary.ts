import type {
  GeoPoint,
  RecapShare,
  RecapShareMoment,
  RecapTravelSummary,
  RoutePoint,
} from '@/types/domain';

const EARTH_RADIUS_METERS = 6371000;
const FALLBACK_ARTIST = 'Soundlog';
const FALLBACK_PLACE = '위치 없음';
const FALLBACK_TITLE = '저장된 리캡';

type TravelSummaryInput = {
  endedAt?: string;
  fallbackPlaceName?: string;
  moments: RecapShareMoment[];
  routePoints?: RoutePoint[];
  startedAt?: string;
};

function toTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? undefined : time;
}

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

function getUniquePlaces(moments: RecapShareMoment[]) {
  const places: string[] = [];

  moments.forEach((moment) => {
    const placeName = moment.placeName.trim();

    if (placeName && places[places.length - 1] !== placeName) {
      places.push(placeName);
    }
  });

  return places;
}

export function createFallbackRecapMoment(recap: RecapShare): RecapShareMoment {
  return {
    artistName: recap.artistName || FALLBACK_ARTIST,
    id: recap.id,
    imageUrl: recap.backgroundImageUrl,
    placeName: recap.placeName || FALLBACK_PLACE,
    recordedAt: recap.recordedAt,
    trackTitle: recap.trackTitle || FALLBACK_TITLE,
  };
}

export function getRecapSoundLogs(recap: RecapShare) {
  const moments = recap.moments?.length ? recap.moments : [createFallbackRecapMoment(recap)];

  return [...moments].sort((first, second) => {
    const firstTime = toTime(first.recordedAt) ?? 0;
    const secondTime = toTime(second.recordedAt) ?? 0;

    return firstTime - secondTime;
  });
}

export function createRecapTravelSummary({
  endedAt,
  fallbackPlaceName = FALLBACK_PLACE,
  moments,
  routePoints = [],
  startedAt,
}: TravelSummaryInput): RecapTravelSummary {
  const orderedMoments = [...moments].sort((first, second) => {
    const firstTime = toTime(first.recordedAt) ?? 0;
    const secondTime = toTime(second.recordedAt) ?? 0;

    return firstTime - secondTime;
  });
  const firstMoment = orderedMoments[0];
  const lastMoment = orderedMoments[orderedMoments.length - 1];
  const summaryStartedAt = startedAt ?? firstMoment?.recordedAt;
  const summaryEndedAt = endedAt ?? lastMoment?.recordedAt ?? summaryStartedAt;
  const startTime = toTime(summaryStartedAt);
  const endTime = toTime(summaryEndedAt);
  const durationMinutes =
    startTime !== undefined && endTime !== undefined
      ? Math.max(0, Math.round((endTime - startTime) / 60000))
      : 0;
  const locatedMoments = orderedMoments.filter(
    (moment): moment is RecapShareMoment & { location: GeoPoint } => Boolean(moment.location),
  );
  const routeLocations = routePoints.length > 1 ? routePoints : locatedMoments.map((moment) => moment.location);
  const distanceMeters = routeLocations.reduce((distance, location, index) => {
    const previousLocation = routeLocations[index - 1];

    if (!previousLocation) {
      return distance;
    }

    return distance + getDistanceMeters(previousLocation, location);
  }, 0);
  const placeNames = getUniquePlaces(orderedMoments);
  const startPlaceName = firstMoment?.placeName ?? placeNames[0] ?? fallbackPlaceName;
  const endPlaceName =
    lastMoment?.placeName ?? placeNames[placeNames.length - 1] ?? startPlaceName;

  return {
    distanceMeters: Math.round(distanceMeters),
    durationMinutes,
    endedAt: summaryEndedAt,
    endPlaceName,
    placeNames: placeNames.length ? placeNames : [fallbackPlaceName],
    recordedLocationCount: locatedMoments.length,
    routePointCount: routePoints.length || undefined,
    startedAt: summaryStartedAt,
    startPlaceName,
  };
}

export function getRecapTravelSummary(recap: RecapShare) {
  return (
    recap.travelSummary ??
    createRecapTravelSummary({
      fallbackPlaceName: recap.placeName,
      moments: getRecapSoundLogs(recap),
      routePoints: recap.routePoints,
    })
  );
}
