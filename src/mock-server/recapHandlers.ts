import { mockServerDelay } from '@/mock-server/delay';
import { recapItems, recapShareById } from '@/mocks/recapMocks';
import { RecapItem } from '@/types/domain';

const createdRecapItems: RecapItem[] = [];

export const recapMockHandlers = {
  createShareEvent: (_recapId: string, _type: 'os_share' | 'save_image') =>
    mockServerDelay('recap.share', { accepted: true }),
  createRecap: (input: {
    momentLogIds?: string[];
    representativeTrackId?: string;
    sessionId?: string;
    title?: string;
  }) => {
    const createdAt = new Date().toISOString();
    const id = `mock-recap-${Date.now()}`;
    const recap: RecapItem = {
      createdAt,
      id,
      momentCount: input.momentLogIds?.length ?? 0,
      placeName: 'Soundlog',
      representativeTrack: {
        artist: 'Soundlog',
        fallbackColor: '#B7E628',
        id: input.representativeTrackId ?? 'seoul-city',
        title: '저장된 순간',
      },
      sessionId: input.sessionId,
      title: input.title ?? '여행 Recap',
    };

    createdRecapItems.unshift(recap);
    recapShareById[id] = {
      artistName: recap.representativeTrack.artist,
      id,
      moments: [
        {
          artistName: recap.representativeTrack.artist,
          id,
          placeName: recap.placeName,
          recordedAt: createdAt,
          trackTitle: recap.representativeTrack.title,
        },
      ],
      placeName: recap.placeName,
      recordedAt: createdAt,
      trackTitle: recap.representativeTrack.title,
    };

    return mockServerDelay('recap.create', recap);
  },
  getRecapList: () => mockServerDelay('recap.list', [...createdRecapItems, ...recapItems]),
  getRecapShare: (id?: string) =>
    mockServerDelay('recap.share', id ? recapShareById[id] : undefined),
};
