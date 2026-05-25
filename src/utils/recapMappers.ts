import { MomentLog, RecapItem, RecapShare } from '@/types/domain';

const FALLBACK_ARTIST = 'Soundlog';
const FALLBACK_PLACE = '위치 없음';
const FALLBACK_TITLE = '저장된 순간';
export const SESSION_RECAP_ID_PREFIX = 'session-recap__';

export type MomentLogGroup = {
  id: string;
  logs: MomentLog[];
  sessionId?: string;
};

function getNewestLog(logs: MomentLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

export function createSessionRecapId(sessionId: string) {
  return `${SESSION_RECAP_ID_PREFIX}${sessionId}`;
}

export function extractSessionIdFromRecapId(id?: string) {
  if (!id?.startsWith(SESSION_RECAP_ID_PREFIX)) {
    return undefined;
  }

  return id.slice(SESSION_RECAP_ID_PREFIX.length);
}

export function createMomentLogGroups(logs: MomentLog[]): MomentLogGroup[] {
  const groupMap = new Map<string, MomentLogGroup>();

  logs.forEach((log) => {
    const groupKey = log.sessionId ? `session:${log.sessionId}` : `log:${log.id}`;
    const existingGroup = groupMap.get(groupKey);

    if (existingGroup) {
      existingGroup.logs.push(log);
      return;
    }

    groupMap.set(groupKey, {
      id: log.sessionId ? createSessionRecapId(log.sessionId) : log.id,
      logs: [log],
      sessionId: log.sessionId,
    });
  });

  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      logs: [...group.logs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }))
    .sort((a, b) => {
      const aRepresentative = getNewestLog(a.logs);
      const bRepresentative = getNewestLog(b.logs);

      return (
        new Date(bRepresentative?.createdAt ?? 0).getTime() -
        new Date(aRepresentative?.createdAt ?? 0).getTime()
      );
    });
}

export function momentLogGroupToRecapItem(group: MomentLogGroup): RecapItem {
  const representativeLog = getNewestLog(group.logs);

  if (!representativeLog) {
    return {
      createdAt: new Date().toISOString(),
      id: group.id,
      momentCount: 0,
      placeName: FALLBACK_PLACE,
      representativeTrack: {
        artist: FALLBACK_ARTIST,
        fallbackColor: '#2B176C',
        id: `${group.id}-fallback-track`,
        title: FALLBACK_TITLE,
      },
      sessionId: group.sessionId,
      title: '여행 Recap',
    };
  }

  const baseItem = momentLogToRecapItem(representativeLog);
  const momentCount = group.logs.length;
  const placeName = baseItem.placeName;

  return {
    ...baseItem,
    id: group.id,
    momentCount,
    sessionId: group.sessionId,
    title: momentCount > 1 ? `${placeName} 여행 기록` : baseItem.title,
  };
}

export function momentLogGroupToRecapShare(group: MomentLogGroup): RecapShare | undefined {
  const representativeLog = getNewestLog(group.logs);

  if (!representativeLog) {
    return undefined;
  }

  return {
    ...momentLogToRecapShare(representativeLog),
    id: group.id,
  };
}

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
