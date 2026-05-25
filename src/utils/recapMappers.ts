import { MomentLog, RecapItem, RecapShare } from '@/types/domain';

const FALLBACK_ARTIST = 'Soundlog';
const FALLBACK_PLACE = '위치 없음';
const FALLBACK_TITLE = '저장된 순간';

export function momentLogToRecapItem(log: MomentLog): RecapItem {
  return {
    createdAt: log.createdAt,
    id: log.id,
    placeName: log.placeName ?? FALLBACK_PLACE,
    representativeTrack: log.track ?? {
      artist: FALLBACK_ARTIST,
      fallbackColor: '#2B176C',
      id: `${log.id}-fallback-track`,
      title: FALLBACK_TITLE,
    },
    title: log.track?.title ?? FALLBACK_TITLE,
  };
}

export function momentLogToRecapShare(log: MomentLog): RecapShare {
  return {
    artistName: log.track?.artist ?? FALLBACK_ARTIST,
    backgroundImageUrl: log.photoUri,
    discImageUrl: log.photoUri,
    id: log.id,
    placeName: log.placeName ?? FALLBACK_PLACE,
    recordedAt: log.createdAt,
    trackTitle: log.track?.title ?? FALLBACK_TITLE,
  };
}
