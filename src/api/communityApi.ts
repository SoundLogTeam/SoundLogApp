import {
  createIdempotencyKey,
  requestApi,
  shouldAttemptAuthenticatedApi,
} from '@/api/client';
import type {
  CommunityVisibility,
  GeoPoint,
  MoodTag,
  MusicMatch,
  RecapItem,
  SoundMapPin,
  Track,
  TravelMateRequest,
  TravelMode,
  TravelRoom,
  TravelRoomMoment,
} from '@/types/domain';
import { sanitizeTrack } from '@/utils/trackSanitizer';

type CreateTravelRoomInput = {
  sessionId?: string;
  title: string;
  visibility?: 'companions' | 'invite_only';
};

type AddTravelRoomMomentInput = {
  artistName?: string;
  momentLogId?: string;
  note?: string;
  placeName?: string;
  status?: 'accepted' | 'candidate';
  trackId?: string;
  trackTitle?: string;
};

type UpsertCurrentTrackInput = {
  artistName?: string;
  location: GeoPoint;
  moodTags?: MoodTag[];
  placeName?: string;
  sessionId?: string;
  trackId?: string;
  trackTitle?: string;
  travelMode?: TravelMode;
  ttlMinutes?: number;
  visibility: CommunityVisibility;
};

type SoundMapQuery = {
  lat?: number;
  lng?: number;
  mood?: string;
  radiusMeters?: number;
  state?: string;
  visibility?: Exclude<CommunityVisibility, 'private'>;
};

function sanitizeSoundMapPin(pin: SoundMapPin): SoundMapPin {
  return {
    ...pin,
    track: pin.track ? sanitizeTrack(pin.track) : undefined,
  };
}

function sanitizeMusicMatch(match: MusicMatch): MusicMatch {
  return {
    ...match,
    pin: sanitizeSoundMapPin(match.pin),
  };
}

function sanitizeRoomMoment(moment: TravelRoomMoment): TravelRoomMoment {
  return {
    ...moment,
    track: moment.track ? sanitizeTrack(moment.track) : undefined,
  };
}

function sanitizeTravelRoom(room: TravelRoom): TravelRoom {
  return {
    ...room,
    moments: room.moments.map(sanitizeRoomMoment),
  };
}

function trackMomentInput(track?: Track, placeName?: string): AddTravelRoomMomentInput {
  return {
    artistName: track?.artist,
    note: track ? `${track.title}을 공동 Recap 후보로 추가` : undefined,
    placeName,
    status: 'candidate',
    trackId: track?.id,
    trackTitle: track?.title,
  };
}

export const communityApi = {
  createTravelRoom: async (input: CreateTravelRoomInput) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    const room = await requestApi<TravelRoom>('/v1/travel-rooms', {
      body: input,
      method: 'POST',
    });

    return sanitizeTravelRoom(room);
  },
  addCurrentTrackMoment: async (roomId: string, track?: Track, placeName?: string) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    const moment = await requestApi<TravelRoomMoment>(
      `/v1/travel-rooms/${encodeURIComponent(roomId)}/moments`,
      {
        body: trackMomentInput(track, placeName),
        method: 'POST',
      },
    );

    return sanitizeRoomMoment(moment);
  },
  createTravelRoomRecap: async (
    roomId: string,
    input: { representativeTrackId?: string; templateId?: 'album' | 'film' | 'lp'; title?: string },
  ) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<RecapItem>(`/v1/travel-rooms/${encodeURIComponent(roomId)}/recaps`, {
      body: input,
      idempotencyKey: createIdempotencyKey(`travel-room-recap-${roomId}`),
      method: 'POST',
    });
  },
  getSoundMap: async (query: SoundMapQuery) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return [];
    }

    const pins = await requestApi<SoundMapPin[]>('/v1/sound-map', { query });

    return pins.map(sanitizeSoundMapPin);
  },
  getNearbySounds: async (query: SoundMapQuery) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return [];
    }

    const pins = await requestApi<Array<SoundMapPin & { matchScore?: number; targetPinId?: string }>>(
      '/v1/sound-map/nearby',
      { query },
    );

    return pins.map(sanitizeSoundMapPin);
  },
  getMusicMatches: async (query: SoundMapQuery) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return [];
    }

    const matches = await requestApi<MusicMatch[]>('/v1/music-matches', { query });

    return matches.map(sanitizeMusicMatch);
  },
  upsertCurrentTrack: async (input: UpsertCurrentTrackInput) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    const pin = await requestApi<SoundMapPin>('/v1/sound-map/current-track', {
      body: input,
      method: 'POST',
    });

    return sanitizeSoundMapPin(pin);
  },
  createTravelMateRequest: async (input: {
    messageTemplate?: 'cafe_together' | 'liked_track' | 'walk_together';
    targetPinId?: string;
    targetUserId?: string;
  }) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return undefined;
    }

    return requestApi<TravelMateRequest>('/v1/travel-mate-requests', {
      body: {
        messageTemplate: input.messageTemplate ?? 'liked_track',
        targetPinId: input.targetPinId,
        targetUserId: input.targetUserId,
      },
      method: 'POST',
    });
  },
  blockUser: async (input: { targetPinId?: string; targetUserId?: string }) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return { accepted: false };
    }

    return requestApi<{ accepted: boolean }>('/v1/community/blocks', {
      body: input,
      method: 'POST',
    });
  },
  reportTarget: async (input: {
    details?: string;
    reason: 'inappropriate' | 'other' | 'safety' | 'spam';
    requestId?: string;
    targetPinId?: string;
    targetUserId?: string;
  }) => {
    if (!shouldAttemptAuthenticatedApi()) {
      return { accepted: false };
    }

    return requestApi<{ accepted: boolean }>('/v1/community/reports', {
      body: input,
      method: 'POST',
    });
  },
};
