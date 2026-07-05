import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
} from '@/api/client';
import { GeoPoint, MomentLog, MoodTag, Track, TravelMode } from '@/types/domain';
import { sanitizeTrack } from '@/utils/trackSanitizer';

type CreateMomentLogInput = {
  createdAt: string;
  idempotencyKey?: string;
  location?: GeoPoint;
  moodTags: MoodTag[];
  photoUri: string;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  sessionId?: string;
  track?: Track;
  travelMode?: TravelMode;
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

  formData.append('photo', {
    name: getPhotoName(input.photoUri),
    type: 'image/jpeg',
    uri: input.photoUri,
  } as unknown as Blob);
  formData.append('createdAt', input.createdAt);
  formData.append('moodTags', input.moodTags.join(','));

  appendIfDefined(formData, 'artistName', input.track?.artist);
  appendIfDefined(formData, 'lat', input.location?.lat);
  appendIfDefined(formData, 'lng', input.location?.lng);
  appendIfDefined(formData, 'placeCategory', input.placeCategory);
  appendIfDefined(formData, 'placeId', input.placeId);
  appendIfDefined(formData, 'placeName', input.placeName);
  appendIfDefined(formData, 'sessionId', input.sessionId);
  appendIfDefined(formData, 'trackId', input.track?.id);
  appendIfDefined(formData, 'trackTitle', input.track?.title);
  appendIfDefined(formData, 'travelMode', input.travelMode);

  return formData;
}

export const momentLogApi = {
  createMomentLog: (input: CreateMomentLogInput) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return Promise.resolve<MomentLog | undefined>(undefined);
    }

    return requestApi<MomentLog>('/v1/moment-logs', {
      body: toFormData(input),
      idempotencyKey: input.idempotencyKey ?? createIdempotencyKey('moment-log'),
      method: 'POST',
    }).then((log) => ({
      ...log,
      track: log.track ? sanitizeTrack(log.track) : undefined,
    }));
  },
};
