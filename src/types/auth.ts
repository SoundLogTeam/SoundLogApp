import { UserProfile } from '@/store/userProfileStore';

export type AuthProvider = 'email';

export type AuthStatus = 'authenticated' | 'checking' | 'unauthenticated';

export type AuthUser = {
  id: string;
  displayName: string;
  email?: string;
  profileImageUrl?: string;
  provider: AuthProvider;
  termsAcceptedAt?: string;
  termsVersion?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  termsAccepted: true;
  termsVersion: string;
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
