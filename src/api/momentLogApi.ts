import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
  uploadApiFile,
} from '@/api/client';
import {
  GeoPoint,
  MomentLog,
  MoodTag,
  RecapTemplateId,
  RecapVisibility,
  Track,
  TravelMode,
} from '@/types/domain';
import { sanitizeTrack } from '@/utils/trackSanitizer';

const RECAP_CAPTURE_API_PATH = '/v1/recap-captures';

export type CreateMomentLogInput = {
  createdAt: string;
  idempotencyKey?: string;
  location?: GeoPoint;
  moodTags: MoodTag[];
  note?: string;
  photoUri?: string;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  recapVisibility?: RecapVisibility;
  sessionId?: string;
  templateId?: RecapTemplateId;
  track?: Track;
  travelMode?: TravelMode;
};

export type MomentLogListParams = {
  cursor?: string;
  limit?: number;
  sessionId?: string;
};

export type UpdateMomentLogInput = {
  createdAt?: string;
  location?: GeoPoint | null;
  moodTags?: MoodTag[];
  note?: string | null;
  placeCategory?: string | null;
  placeId?: string | null;
  placeName?: string | null;
  recapVisibility?: RecapVisibility;
  sessionId?: string | null;
  templateId?: RecapTemplateId;
  track?: Track;
  travelMode?: TravelMode | null;
};

function getPhotoName(photoUri: string) {
  return photoUri.split('/').pop() || `moment-${Date.now()}.jpg`;
}

function getPhotoContentType(photoUri: string) {
  const extension = getPhotoName(photoUri).split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function toCreateParameters(input: CreateMomentLogInput) {
  const parameters: Record<string, string> = {
    createdAt: input.createdAt,
    moodTags: input.moodTags.join(','),
  };
  const optionalParameters = {
    artistName: input.track?.artist,
    lat: input.location?.lat,
    lng: input.location?.lng,
    note: input.note,
    placeCategory: input.placeCategory,
    placeId: input.placeId,
    placeName: input.placeName,
    sessionId: input.sessionId,
    templateId: input.templateId,
    trackId: input.track?.id,
    trackTitle: input.track?.title,
    travelMode: input.travelMode,
    visibility: input.recapVisibility,
  };

  Object.entries(optionalParameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      parameters[key] = String(value);
    }
  });

  return parameters;
}

function toFormData(input: CreateMomentLogInput) {
  const formData = new FormData();

  Object.entries(toCreateParameters(input)).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return formData;
}

function toUpdateBody(input: UpdateMomentLogInput) {
  const body: Record<string, unknown> = {};

  if ('createdAt' in input) {
    body.createdAt = input.createdAt;
  }

  if ('location' in input) {
    body.lat = input.location?.lat ?? null;
    body.lng = input.location?.lng ?? null;
  }

  if ('moodTags' in input) {
    body.moodTags = input.moodTags;
  }

  if ('note' in input) {
    body.note = input.note;
  }

  if ('placeCategory' in input) {
    body.placeCategory = input.placeCategory;
  }

  if ('placeId' in input) {
    body.placeId = input.placeId;
  }

  if ('placeName' in input) {
    body.placeName = input.placeName;
  }

  if ('sessionId' in input) {
    body.sessionId = input.sessionId;
  }

  if ('templateId' in input) {
    body.templateId = input.templateId;
  }

  if ('track' in input) {
    body.artistName = input.track?.artist;
    body.trackId = input.track?.id;
    body.trackTitle = input.track?.title;
  }

  if ('travelMode' in input) {
    body.travelMode = input.travelMode;
  }

  if ('recapVisibility' in input) {
    body.visibility = input.recapVisibility;
  }

  return body;
}

function sanitizeMomentLog(log: MomentLog) {
  return {
    ...log,
    track: log.track ? sanitizeTrack(log.track) : undefined,
  };
}

export const momentLogApi = {
  createMomentLog: async (input: CreateMomentLogInput) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    const idempotencyKey = input.idempotencyKey ?? createIdempotencyKey('recap-capture');
    const request = input.photoUri
      ? uploadApiFile<MomentLog>(RECAP_CAPTURE_API_PATH, input.photoUri, {
          idempotencyKey,
          mimeType: getPhotoContentType(input.photoUri),
          parameters: toCreateParameters(input),
        })
      : requestApi<MomentLog>(RECAP_CAPTURE_API_PATH, {
          body: toFormData(input),
          idempotencyKey,
          method: 'POST',
        });

    return request.then(sanitizeMomentLog);
  },
  getMomentLogs: async (params: MomentLogListParams = {}) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog[]>([]);
    }

    const logs = await requestApi<MomentLog[]>(RECAP_CAPTURE_API_PATH, {
      query: params,
    });

    return logs.map(sanitizeMomentLog);
  },
  deleteMomentLog: (momentLogId: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<boolean | undefined>(undefined);
    }

    return requestApi<{ accepted: boolean }>(`${RECAP_CAPTURE_API_PATH}/${momentLogId}`, {
      method: 'DELETE',
    }).then((response) => response.accepted);
  },
  updateMomentLog: (momentLogId: string, input: UpdateMomentLogInput) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    return requestApi<MomentLog>(`${RECAP_CAPTURE_API_PATH}/${momentLogId}`, {
      body: toUpdateBody(input),
      method: 'PATCH',
    }).then(sanitizeMomentLog);
  },
  updateMomentLogPhoto: async (momentLogId: string, photoUri: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    return uploadApiFile<MomentLog>(
      `${RECAP_CAPTURE_API_PATH}/${momentLogId}/photo`,
      photoUri,
      {
        httpMethod: 'PUT',
        mimeType: getPhotoContentType(photoUri),
      },
    ).then(sanitizeMomentLog);
  },
  deleteMomentLogPhoto: (momentLogId: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    return requestApi<MomentLog>(`${RECAP_CAPTURE_API_PATH}/${momentLogId}/photo`, {
      method: 'DELETE',
    }).then(sanitizeMomentLog);
  },
};
