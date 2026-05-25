import { mockDelay } from '@/api/mockDelay';
import { recapItems, recapShareById } from '@/mocks/recapMocks';

export const recapApi = {
  getRecapList: () => mockDelay(recapItems),
  getRecapShare: (id?: string) => mockDelay(id ? recapShareById[id] : undefined),
};
