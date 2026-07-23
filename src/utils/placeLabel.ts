import { GeoPoint, PlaceContext } from '@/types/domain';

const COORDINATE_PLACE_LABEL =
  /(?:현재\s*위치|위치)?\s*-?\d{1,3}(?:\.\d+)?\s*[,/]\s*-?\d{1,3}(?:\.\d+)?/;

export function getPlaceDisplayTitle(
  place?: PlaceContext,
  fallback = '선택한 지역',
) {
  const title = place?.title.trim();

  if (!title || COORDINATE_PLACE_LABEL.test(title)) {
    return fallback;
  }

  return title;
}

export function formatPlaceLabel(location?: GeoPoint) {
  if (!location) {
    return '위치 없음';
  }

  return '위치가 저장된 지역';
}
