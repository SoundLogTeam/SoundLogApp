import { getApiBaseUrl } from '@/api/client';

export type PublicImageRegion =
  | 'busan'
  | 'chuncheon'
  | 'daegu'
  | 'geoje'
  | 'gyeongju'
  | 'jeju'
  | 'jeonju'
  | 'seoul';

export function getPublicImageUrl(region: PublicImageRegion) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return undefined;
  }

  try {
    return `${new URL(apiBaseUrl).origin}/assets/playlists/${region}.webp`;
  } catch {
    return undefined;
  }
}
