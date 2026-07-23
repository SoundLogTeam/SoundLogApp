import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
} from '@/api/client';
import type {
  RecapItem,
  RecapMapMarker,
  RecapMapScope,
  RecapShare,
  RecapTemplateId,
  RecapVisibility,
  RoutePoint,
} from '@/types/domain';
import { sanitizeRecapItem } from '@/utils/trackSanitizer';

type CreateRecapInput = {
  momentLogIds?: string[];
  representativeTrackId?: string;
  routePoints?: RoutePoint[];
  sessionId?: string;
  templateId: RecapTemplateId;
  title?: string;
  visibility?: RecapVisibility;
};

type RecapShareEventType = 'os_share' | 'save_image';

type RecapMarkerQuery = {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  scope?: RecapMapScope;
};

export type RecapListScope = 'all' | 'mine' | 'others';

type RecapListQuery = {
  limit?: number;
  scope?: RecapListScope;
};

export const recapApi = {
  getRecapMarkers: async (query: RecapMarkerQuery) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapMapMarker[]>([]);
    }

    return requestApi<RecapMapMarker[]>('/v1/recap-markers', { query });
  },
  updateRecapVisibility: async (recapId: string, visibility: RecapVisibility) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapItem | undefined>(undefined);
    }

    const recap = await requestApi<RecapItem>(
      `/v1/recaps/${encodeURIComponent(recapId)}/visibility`,
      {
        body: { visibility },
        method: 'PATCH',
      },
    );

    return sanitizeRecapItem(recap);
  },
  updateRecapThumbnail: async (recapId: string, momentId: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapItem | undefined>(undefined);
    }

    const recap = await requestApi<RecapItem>(
      `/v1/recaps/${encodeURIComponent(recapId)}/thumbnail`,
      {
        body: { momentId },
        method: 'PATCH',
      },
    );

    return sanitizeRecapItem(recap);
  },
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
  createRecap: async (input: CreateRecapInput, idempotencyKey?: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapItem | undefined>(undefined);
    }

    const recap = await requestApi<RecapItem>('/v1/recaps', {
      body: input,
      idempotencyKey:
        idempotencyKey ?? createIdempotencyKey(`recap-${input.sessionId ?? 'session'}`),
      method: 'POST',
    });

    return sanitizeRecapItem(recap);
  },
  getRecapList: async (query: RecapListQuery = {}) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapItem[]>([]);
    }

    const recaps = await requestApi<RecapItem[]>('/v1/recaps', {
      query: {
        limit: query.limit ?? 20,
        scope: query.scope ?? 'mine',
      },
    });

    return recaps.map(sanitizeRecapItem);
  },
  getRecapShare: async (id?: string) => {
    if (!id || !shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<RecapShare | null>(null);
    }

    return requestApi<RecapShare>(`/v1/recaps/${encodeURIComponent(id)}/share`);
  },
};
