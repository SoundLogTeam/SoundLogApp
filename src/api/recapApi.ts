import {
  canUseAuthenticatedApi,
  createIdempotencyKey,
  requestApi,
  shouldUseServerApi,
} from '@/api/client';
import { getMockServer } from '@/api/mockServerClient';
import type { RecapItem, RecapShare, RecapTemplateId } from '@/types/domain';

type CreateRecapInput = {
  momentLogIds?: string[];
  representativeTrackId?: string;
  sessionId?: string;
  templateId: RecapTemplateId | 'video';
  title?: string;
};

type RecapShareEventType = 'os_share' | 'save_image';

export const recapApi = {
  createShareEvent: async (recapId: string, type: RecapShareEventType) => {
    if (!shouldUseServerApi()) {
      const mockServer = await getMockServer();
      return mockServer.recap.createShareEvent(recapId, type);
    }

    if (!canUseAuthenticatedApi()) {
      return Promise.resolve({ accepted: false });
    }

    return requestApi<{ accepted: boolean }>(
      `/v1/recaps/${encodeURIComponent(recapId)}/share-events`,
      {
        body: {
          createdAt: new Date().toISOString(),
          type,
        },
        idempotencyKey: createIdempotencyKey(`recap-share-${recapId}-${type}`),
        method: 'POST',
      },
    );
  },
  createRecap: async (input: CreateRecapInput) => {
    if (!shouldUseServerApi()) {
      const mockServer = await getMockServer();
      return mockServer.recap.createRecap(input);
    }

    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<RecapItem | undefined>(undefined);
    }

    return requestApi<RecapItem>('/v1/recaps', {
      body: input,
      idempotencyKey: createIdempotencyKey(`recap-${input.sessionId ?? 'session'}`),
      method: 'POST',
    });
  },
  getRecapList: async () => {
    if (!shouldUseServerApi()) {
      const mockServer = await getMockServer();
      return mockServer.recap.getRecapList();
    }

    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<RecapItem[]>([]);
    }

    return requestApi<RecapItem[]>('/v1/recaps', {
      query: { limit: 20 },
    });
  },
  getRecapShare: async (id?: string) => {
    if (!shouldUseServerApi()) {
      const mockServer = await getMockServer();
      return mockServer.recap.getRecapShare(id);
    }

    if (!id || !canUseAuthenticatedApi()) {
      return Promise.resolve<RecapShare | undefined>(undefined);
    }

    return requestApi<RecapShare>(`/v1/recaps/${encodeURIComponent(id)}/share`);
  },
};
