import { mockServerDelay } from '@/mock-server/delay';
import { recapItems, recapShareById } from '@/mocks/recapMocks';

export const recapMockHandlers = {
  getRecapList: () => mockServerDelay('recap.list', recapItems),
  getRecapShare: (id?: string) =>
    mockServerDelay('recap.share', id ? recapShareById[id] : undefined),
};
