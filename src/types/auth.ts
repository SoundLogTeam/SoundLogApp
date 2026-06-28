import { UserProfile } from '@/store/userProfileStore';

export type AuthProvider = 'apple' | 'google' | 'kakao';

export type AuthStatus =
  | 'authenticated'
  | 'checking'
  | 'guest'
  | 'unauthenticated';

export type AuthUser = {
  id: string;
  displayName: string;
  email?: string;
  profileImageUrl?: string;
  provider: AuthProvider;
};

export type AuthDeviceInfo = {
  appVersion?: string;
  deviceId?: string;
  platform: 'android' | 'ios' | 'web';
};

export type SocialLoginRequest = {
  authorizationCode?: string;
  codeVerifier?: string;
  device?: AuthDeviceInfo;
  idToken?: string;
  provider: AuthProvider;
  providerAccessToken?: string;
  providerDisplayName?: string;
  providerToken?: string;
  redirectUri?: string;
};

export type AuthSession = {
  accessToken: string;
  expiresIn: number;
  isNewUser: boolean;
  profile?: UserProfile;
  refreshToken: string;
  user: AuthUser;
};

export type AuthMe = {
  musicPlatform?: {
    connected: boolean;
    providerUserId?: string;
    selectedPlatformId: string;
    updatedAt?: string;
  };
  profile?: UserProfile;
  user: AuthUser;
};

export type LocalDataMigrationPayload = {
  idempotencyKey: string;
  libraryTrackCount: number;
  momentLogCount: number;
  recapDraftCount: number;
};

export type LocalDataMigrationResult = {
  accepted: boolean;
  migrated: {
    libraryTrackCount: number;
    momentLogCount: number;
    recapDraftCount: number;
  };
};
