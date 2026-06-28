import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { SpotifyAuthSession } from '@/store/spotifyAuthStore';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

const discovery = {
  authorizationEndpoint: `${SPOTIFY_ACCOUNTS_URL}/authorize`,
  tokenEndpoint: `${SPOTIFY_ACCOUNTS_URL}/api/token`,
};

const SPOTIFY_SCOPES = [
  'app-remote-control',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-playback-state',
];

type SpotifyProfileResponse = {
  display_name?: string;
  id?: string;
};

export type SpotifyAuthErrorCode =
  | 'cancelled'
  | 'configuration_missing'
  | 'token_exchange_failed'
  | 'unsupported_web';

export class SpotifyAuthError extends Error {
  code: SpotifyAuthErrorCode;

  constructor(code: SpotifyAuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type SpotifyExtraConfig = {
  spotify?: {
    clientId?: string;
  };
};

export function getSpotifyClientId() {
  const extra = Constants.expoConfig?.extra as SpotifyExtraConfig | undefined;

  return extra?.spotify?.clientId ?? process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
}

export function getSpotifyRedirectUri() {
  return AuthSession.makeRedirectUri({
    path: 'spotify-auth',
    scheme: 'soundlog',
  });
}

export function isSpotifyConfigured() {
  return Boolean(getSpotifyClientId());
}

export function isSpotifySessionFresh(session?: SpotifyAuthSession) {
  if (!session) {
    return false;
  }

  return new Date(session.expiresAt).getTime() - TOKEN_EXPIRY_BUFFER_MS > Date.now();
}

function createExpiresAt(expiresIn?: number) {
  return new Date(Date.now() + (expiresIn ?? 3600) * 1000).toISOString();
}

async function fetchSpotifyProfile(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  return (await response.json()) as SpotifyProfileResponse;
}

export function getSpotifyAuthErrorMessage(error: unknown) {
  if (error instanceof SpotifyAuthError) {
    if (error.code === 'configuration_missing') {
      return 'Spotify Client ID가 아직 설정되지 않았어요.';
    }

    if (error.code === 'unsupported_web') {
      return 'Spotify 연결은 모바일 앱에서 확인해주세요.';
    }

    if (error.code === 'cancelled') {
      return 'Spotify 연결이 취소됐어요.';
    }
  }

  return 'Spotify 연결에 실패했어요. 잠시 후 다시 시도해주세요.';
}

export async function connectSpotifyAccount(): Promise<SpotifyAuthSession> {
  const clientId = getSpotifyClientId();
  const redirectUri = getSpotifyRedirectUri();

  if (!clientId) {
    throw new SpotifyAuthError('configuration_missing', 'Spotify Client ID is missing.');
  }

  if (Platform.OS === 'web') {
    throw new SpotifyAuthError('unsupported_web', 'Spotify auth is only enabled for mobile.');
  }

  const request = new AuthSession.AuthRequest({
    clientId,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: SPOTIFY_SCOPES,
    usePKCE: true,
  });
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code) {
    throw new SpotifyAuthError('cancelled', 'Spotify auth was not completed.');
  }

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
      redirectUri,
    },
    discovery,
  );

  if (!token.accessToken) {
    throw new SpotifyAuthError('token_exchange_failed', 'Spotify token exchange failed.');
  }

  const profile = await fetchSpotifyProfile(token.accessToken).catch(() => undefined);

  return {
    accessToken: token.accessToken,
    connectedAt: new Date().toISOString(),
    displayName: profile?.display_name,
    expiresAt: createExpiresAt(token.expiresIn),
    refreshToken: token.refreshToken,
    scope: token.scope,
    tokenType: token.tokenType,
    userId: profile?.id,
  };
}

export async function refreshSpotifyAccount(
  session: SpotifyAuthSession,
): Promise<SpotifyAuthSession> {
  const clientId = getSpotifyClientId();

  if (!clientId) {
    throw new SpotifyAuthError('configuration_missing', 'Spotify Client ID is missing.');
  }

  if (!session.refreshToken) {
    throw new SpotifyAuthError('token_exchange_failed', 'Spotify refresh token is missing.');
  }

  const token = await AuthSession.refreshAsync(
    {
      clientId,
      refreshToken: session.refreshToken,
    },
    discovery,
  );

  return {
    ...session,
    accessToken: token.accessToken,
    expiresAt: createExpiresAt(token.expiresIn),
    refreshToken: token.refreshToken ?? session.refreshToken,
    scope: token.scope ?? session.scope,
    tokenType: token.tokenType ?? session.tokenType,
  };
}
