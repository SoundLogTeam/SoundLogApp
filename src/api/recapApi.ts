import { mockDelay } from '@/api/mockDelay';
import { recapItems, recapShare, recapShareById } from '@/mocks/recapMocks';

export const recapApi = {
  getRecapList: () => mockDelay(recapItems),
  getRecapShare: (id?: string) => mockDelay(recapShareById[id ?? ''] ?? recapShare),
};
