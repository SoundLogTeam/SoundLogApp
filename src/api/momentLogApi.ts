import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
} from '@/api/client';
import { GeoPoint, MomentLog, MoodTag, Track, TravelMode } from '@/types/domain';
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
  sessionId?: string;
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
  sessionId?: string | null;
  track?: Track;
  travelMode?: TravelMode | null;
};

function appendIfDefined(formData: FormData, key: string, value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  formData.append(key, String(value));
}

function getPhotoName(photoUri: string) {
  return photoUri.split('/').pop() || `moment-${Date.now()}.jpg`;
}

function toFormData(input: CreateMomentLogInput) {
  const formData = new FormData();

  if (input.photoUri) {
    formData.append('photo', {
      name: getPhotoName(input.photoUri),
      type: 'image/jpeg',
      uri: input.photoUri,
    } as unknown as Blob);
  }
  formData.append('createdAt', input.createdAt);
  formData.append('moodTags', input.moodTags.join(','));

  appendIfDefined(formData, 'artistName', input.track?.artist);
  appendIfDefined(formData, 'lat', input.location?.lat);
  appendIfDefined(formData, 'lng', input.location?.lng);
  appendIfDefined(formData, 'note', input.note);
  appendIfDefined(formData, 'placeCategory', input.placeCategory);
  appendIfDefined(formData, 'placeId', input.placeId);
  appendIfDefined(formData, 'placeName', input.placeName);
  appendIfDefined(formData, 'sessionId', input.sessionId);
  appendIfDefined(formData, 'trackId', input.track?.id);
  appendIfDefined(formData, 'trackTitle', input.track?.title);
  appendIfDefined(formData, 'travelMode', input.travelMode);

  return formData;
}

function toPhotoFormData(photoUri: string) {
  const formData = new FormData();

  formData.append('photo', {
    name: getPhotoName(photoUri),
    type: 'image/jpeg',
    uri: photoUri,
  } as unknown as Blob);

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

  if ('track' in input) {
    body.artistName = input.track?.artist;
    body.trackId = input.track?.id;
    body.trackTitle = input.track?.title;
  }

  if ('travelMode' in input) {
    body.travelMode = input.travelMode;
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
  createMomentLog: (input: CreateMomentLogInput) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    return requestApi<MomentLog>(RECAP_CAPTURE_API_PATH, {
      body: toFormData(input),
      idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('recap-capture'),
      method: 'POST',
    }).then(sanitizeMomentLog);
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
  updateMomentLogPhoto: (momentLogId: string, photoUri: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    return requestApi<MomentLog>(`${RECAP_CAPTURE_API_PATH}/${momentLogId}/photo`, {
      body: toPhotoFormData(photoUri),
      method: 'PUT',
    }).then(sanitizeMomentLog);
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
