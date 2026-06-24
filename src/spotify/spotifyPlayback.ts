import { useMusicPlatformStore } from '@/store/musicPlatformStore';
import { useSpotifyAuthStore } from '@/store/spotifyAuthStore';
import { Track } from '@/types/domain';
import { getTrackExternalLink, openMusicPlatformUrl } from '@/utils/musicPlatformLinks';
import {
  getSpotifyClientId,
  isSpotifyConfigured,
  isSpotifySessionFresh,
  refreshSpotifyAccount,
} from '@/spotify/spotifyAuth';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export type SpotifyPlaybackFailureCode =
  | 'configuration_missing'
  | 'network_error'
  | 'no_active_device'
  | 'not_connected'
  | 'not_found'
  | 'premium_required'
  | 'rate_limited'
  | 'unauthorized'
  | 'unknown';

export type SpotifyPlaybackResult =
  | {
      ok: true;
    }
  | {
      code: SpotifyPlaybackFailureCode;
      detail?: string;
      ok: false;
    };

type SpotifyErrorResponse = {
  error?: {
    message?: string;
    reason?: string;
    status?: number;
  };
};

type SpotifySearchResponse = {
  tracks?: {
    items?: Array<{
      uri?: string;
    }>;
  };
};

function createTrackQuery(track: Track) {
  const title = track.title.trim();
  const artist = track.artist.trim();

  return artist ? `${artist} ${title}` : title;
}

function getSpotifyTrackUriFromUrl(url?: string) {
  if (!url) {
    return undefined;
  }

  if (url.startsWith('spotify:track:')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== 'open.spotify.com') {
      return undefined;
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const trackIndex = pathSegments.findIndex((segment) => segment === 'track');
    const trackId = pathSegments[trackIndex + 1];

    return trackIndex >= 0 && trackId ? `spotify:track:${trackId}` : undefined;
  } catch {
    return undefined;
  }
}

function getSpotifyTrackUri(track: Track) {
  return (
    getSpotifyTrackUriFromUrl(track.platformUrls?.spotify) ??
    getSpotifyTrackUriFromUrl(track.externalUrl)
  );
}

async function readSpotifyError(response: Response): Promise<SpotifyErrorResponse | undefined> {
  try {
    return (await response.json()) as SpotifyErrorResponse;
  } catch {
    return undefined;
  }
}

function normalizeSpotifyFailure(response: Response, body?: SpotifyErrorResponse) {
  const reason = body?.error?.reason;
  const message = body?.error?.message;

  if (response.status === 401) {
    return { code: 'unauthorized', detail: message, ok: false } satisfies SpotifyPlaybackResult;
  }

  if (response.status === 403) {
    return {
      code: 'premium_required',
      detail: message,
      ok: false,
    } satisfies SpotifyPlaybackResult;
  }

  if (response.status === 404 && reason === 'NO_ACTIVE_DEVICE') {
    return {
      code: 'no_active_device',
      detail: message,
      ok: false,
    } satisfies SpotifyPlaybackResult;
  }

  if (response.status === 404) {
    return { code: 'not_found', detail: message, ok: false } satisfies SpotifyPlaybackResult;
  }

  if (response.status === 429) {
    return { code: 'rate_limited', detail: message, ok: false } satisfies SpotifyPlaybackResult;
  }

  return { code: 'unknown', detail: message, ok: false } satisfies SpotifyPlaybackResult;
}

export function getSpotifyPlaybackFailureMessage(code: SpotifyPlaybackFailureCode) {
  if (code === 'configuration_missing') {
    return 'Spotify Client ID가 설정되지 않았어요.';
  }

  if (code === 'not_connected' || code === 'unauthorized') {
    return 'Spotify 계정을 다시 연결하면 앱에서 바로 제어할 수 있어요.';
  }

  if (code === 'premium_required') {
    return 'Spotify 전체 재생 제어는 Premium 계정에서 사용할 수 있어요.';
  }

  if (code === 'no_active_device') {
    return 'Spotify 앱을 한 번 열어 활성 기기를 만든 뒤 다시 시도해주세요.';
  }

  if (code === 'not_found') {
    return 'Spotify에서 이 곡을 정확히 찾지 못했어요.';
  }

  if (code === 'rate_limited') {
    return 'Spotify 요청이 잠시 많아요. 조금 뒤 다시 시도해주세요.';
  }

  return 'Spotify 재생 요청에 실패했어요. Spotify 앱으로 이어서 열게요.';
}

export function isSpotifyPlaybackReady() {
  const { session } = useSpotifyAuthStore.getState();

  return isSpotifyConfigured() && Boolean(session);
}

export async function ensureSpotifyAccessToken(): Promise<
  | {
      accessToken: string;
      ok: true;
    }
  | {
      code: SpotifyPlaybackFailureCode;
      ok: false;
    }
> {
  const clientId = getSpotifyClientId();
  const { clearSession, session, setSession } = useSpotifyAuthStore.getState();

  if (!clientId) {
    return { code: 'configuration_missing', ok: false };
  }

  if (!session) {
    return { code: 'not_connected', ok: false };
  }

  if (isSpotifySessionFresh(session)) {
    return { accessToken: session.accessToken, ok: true };
  }

  try {
    const refreshedSession = await refreshSpotifyAccount(session);

    setSession(refreshedSession);
    return { accessToken: refreshedSession.accessToken, ok: true };
  } catch {
    clearSession();
    return { code: 'unauthorized', ok: false };
  }
}

async function spotifyRequest(
  path: string,
  options: {
    body?: unknown;
    method?: 'GET' | 'POST' | 'PUT';
  } = {},
): Promise<SpotifyPlaybackResult> {
  const token = await ensureSpotifyAccessToken();

  if (!token.ok) {
    return token;
  }

  try {
    const response = await fetch(`${SPOTIFY_API_URL}${path}`, {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      method: options.method ?? 'GET',
    });

    if (response.ok || response.status === 204) {
      return { ok: true };
    }

    return normalizeSpotifyFailure(response, await readSpotifyError(response));
  } catch {
    return { code: 'network_error', ok: false };
  }
}

async function searchSpotifyTrackUri(track: Track, accessToken: string) {
  const query = createTrackQuery(track);

  if (!query) {
    return undefined;
  }

  const response = await fetch(
    `${SPOTIFY_API_URL}/search?${new URLSearchParams({
      limit: '1',
      q: query,
      type: 'track',
    }).toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    return undefined;
  }

  const data = (await response.json()) as SpotifySearchResponse;

  return data.tracks?.items?.[0]?.uri;
}

export async function resolveSpotifyTrackUri(track: Track) {
  const directUri = getSpotifyTrackUri(track);

  if (directUri) {
    return { ok: true, uri: directUri } as const;
  }

  const token = await ensureSpotifyAccessToken();

  if (!token.ok) {
    return token;
  }

  const searchedUri = await searchSpotifyTrackUri(track, token.accessToken).catch(() => undefined);

  return searchedUri
    ? ({ ok: true, uri: searchedUri } as const)
    : ({ code: 'not_found', ok: false } as const);
}

export async function playSpotifyTrack(track: Track): Promise<SpotifyPlaybackResult> {
  const resolvedUri = await resolveSpotifyTrackUri(track);

  if (!resolvedUri.ok) {
    return resolvedUri;
  }

  return spotifyRequest('/me/player/play', {
    body: {
      uris: [resolvedUri.uri],
    },
    method: 'PUT',
  });
}

async function openSpotifyFallback(track: Track) {
  const spotifyLink = getTrackExternalLink(track, 'spotify');

  if (!spotifyLink.url) {
    return;
  }

  await openMusicPlatformUrl(spotifyLink);
}

export async function playSelectedSpotifyOrFallback(
  track: Track,
): Promise<SpotifyPlaybackResult> {
  const selectedPlatformId = useMusicPlatformStore.getState().selectedPlatformId;

  if (selectedPlatformId !== 'spotify') {
    return { ok: true };
  }

  if (!useSpotifyAuthStore.getState().session) {
    await openSpotifyFallback(track).catch(() => undefined);
    return { code: 'not_connected', ok: false };
  }

  const spotifyResult = await playSpotifyTrack(track);

  if (!spotifyResult.ok) {
    await openSpotifyFallback(track).catch(() => undefined);
  }

  return spotifyResult;
}

export function pauseSpotifyPlayback() {
  return spotifyRequest('/me/player/pause', { method: 'PUT' });
}

export function nextSpotifyPlayback() {
  return spotifyRequest('/me/player/next', { method: 'POST' });
}

export function previousSpotifyPlayback() {
  return spotifyRequest('/me/player/previous', { method: 'POST' });
}
