import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
} from '@/api/client';
import type { RecapItem, RecapShare, RecapTemplateId } from '@/types/domain';
import { sanitizeRecapItem } from '@/utils/trackSanitizer';

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
    if (!shouldAttemptAuthenticatedApi()) {
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
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapItem | undefined>(undefined);
    }

    const recap = await requestApi<RecapItem>('/v1/recaps', {
      body: input,
      idempotencyKey: createIdempotencyKey(`recap-${input.sessionId ?? 'session'}`),
      method: 'POST',
    });

    return sanitizeRecapItem(recap);
  },
  getRecapList: async () => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapItem[]>([]);
    }

    const recaps = await requestApi<RecapItem[]>('/v1/recaps', {
      query: { limit: 20 },
    });

    return recaps.map(sanitizeRecapItem);
  },
  getRecapShare: async (id?: string) => {
    if (!id || !shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapShare | undefined>(undefined);
    }

    return requestApi<RecapShare>(`/v1/recaps/${encodeURIComponent(id)}/share`);
  },
};
