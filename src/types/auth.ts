import { UserProfile } from '@/store/userProfileStore';

export type AuthProvider = 'email';

export type AuthStatus =
  | 'authenticated'
  | 'checking'
  | 'unauthenticated';

export type AuthUser = {
  id: string;
  displayName: string;
  email?: string;
  profileImageUrl?: string;
  provider: AuthProvider;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  displayName?: string;
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
