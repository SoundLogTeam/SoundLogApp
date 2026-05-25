import { GeoPoint } from '@/types/domain';

export function formatPlaceLabel(location?: GeoPoint) {
  if (!location) {
    return '위치 없음';
  }

  return `현재 위치 ${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`;
}
