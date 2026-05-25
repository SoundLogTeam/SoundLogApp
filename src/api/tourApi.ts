import { mapTourLocationItems } from '@/mappers/tourMappers';
import { getMockNearbyPlaces } from '@/mocks/tourMocks';
import { GeoPoint, PlaceContext } from '@/types/domain';

type NearbyPlacesParams = {
  location: GeoPoint;
  radiusMeters?: number;
};

type TourApiResponse = {
  response?: {
    body?: {
      items?: {
        item?: unknown;
      };
    };
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
  };
};

const DEFAULT_TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const DEFAULT_RADIUS_METERS = 2000;
const TOUR_API_TIMEOUT_MS = 4500;

function getTourApiBaseUrl() {
  return process.env.EXPO_PUBLIC_TOUR_API_BASE_URL ?? DEFAULT_TOUR_API_BASE_URL;
}

function getTourApiServiceKey() {
  return process.env.EXPO_PUBLIC_TOUR_API_SERVICE_KEY;
}

function getEncodedServiceKey(serviceKey: string) {
  return serviceKey.includes('%') ? serviceKey : encodeURIComponent(serviceKey);
}

function buildLocationBasedListUrl({ location, radiusMeters = DEFAULT_RADIUS_METERS }: NearbyPlacesParams) {
  const serviceKey = getTourApiServiceKey();

  if (!serviceKey) {
    return undefined;
  }

  const endpoint = `${getTourApiBaseUrl().replace(/\/$/, '')}/locationBasedList2`;
  const params = new URLSearchParams({
    MobileApp: 'Soundlog',
    MobileOS: 'ETC',
    _type: 'json',
    arrange: 'E',
    mapX: String(location.lng),
    mapY: String(location.lat),
    numOfRows: '10',
    pageNo: '1',
    radius: String(radiusMeters),
  });

  return `${endpoint}?serviceKey=${getEncodedServiceKey(serviceKey)}&${params.toString()}`;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TOUR_API_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`tour_api_http_${response.status}`);
    }

    return (await response.json()) as TourApiResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const tourApi = {
  async getNearbyPlaces(params: NearbyPlacesParams): Promise<PlaceContext[]> {
    const fallbackPlaces = getMockNearbyPlaces(params.location);
    const url = buildLocationBasedListUrl(params);

    if (!url) {
      return fallbackPlaces;
    }

    try {
      const data = await fetchWithTimeout(url);
      const resultCode = data.response?.header?.resultCode;

      if (resultCode && resultCode !== '0000') {
        return fallbackPlaces;
      }

      const places = mapTourLocationItems(data.response?.body?.items?.item);

      return places.length > 0 ? places : fallbackPlaces;
    } catch {
      return fallbackPlaces;
    }
  },
};
