import { canUseAuthenticatedApi, isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import { RecapItem, RecapShare } from '@/types/domain';

export const recapApi = {
  getRecapList: () => {
    if (!isRealApiEnabled()) {
      return mockServer.recap.getRecapList();
    }

    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<RecapItem[]>([]);
    }

    return requestApi<RecapItem[]>('/v1/recaps', {
      query: { limit: 20 },
    });
  },
  getRecapShare: (id?: string) => {
    if (!isRealApiEnabled()) {
      return mockServer.recap.getRecapShare(id);
    }

    if (!id || !canUseAuthenticatedApi()) {
      return Promise.resolve<RecapShare | undefined>(undefined);
    }

    return requestApi<RecapShare>(`/v1/recaps/${encodeURIComponent(id)}/share`);
  },
};
