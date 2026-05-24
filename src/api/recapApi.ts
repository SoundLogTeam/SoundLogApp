import { recapItems, recapShare } from '@/mocks/recapMocks';
import { mockDelay } from '@/api/mockDelay';

export const recapApi = {
  getRecapList: () => mockDelay(recapItems),
  getRecapShare: (_id: string) => mockDelay(recapShare),
};
