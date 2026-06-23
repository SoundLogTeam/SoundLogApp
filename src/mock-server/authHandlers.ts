import { mockServerDelay } from '@/mock-server/delay';
import {
  AuthMe,
  AuthProvider,
  AuthSession,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  SocialLoginRequest,
} from '@/types/auth';

const providerLabels: Record<AuthProvider, string> = {
  apple: 'Apple',
  google: 'Google',
  kakao: 'Kakao',
};

let refreshTokenSeed = 1;
let activeSession: AuthSession | undefined;

function createMockToken(prefix: string) {
  refreshTokenSeed += 1;
  return `mock-${prefix}-${Date.now()}-${refreshTokenSeed}`;
}

function createSession(request: SocialLoginRequest): AuthSession {
  const providerLabel = providerLabels[request.provider];
  const userId = `mock-user-${request.provider}`;

  return {
    accessToken: createMockToken('access'),
    expiresIn: 3600,
    isNewUser: false,
    profile: {
      completedOnboarding: false,
      companionType: undefined,
      locationRecommendationEnabled: true,
      preferredGenres: [],
      preferredMoods: [],
      travelStyles: [],
      updatedAt: new Date().toISOString(),
    },
    refreshToken: createMockToken('refresh'),
    user: {
      displayName: `${providerLabel} 여행자`,
      email: `${request.provider}@soundlog.test`,
      id: userId,
      provider: request.provider,
    },
  };
}

export const authMockHandlers = {
  async socialLogin(request: SocialLoginRequest) {
    const session = createSession(request);
    activeSession = session;

    return mockServerDelay('auth.socialLogin', session);
  },

  async refresh(refreshToken?: string) {
    if (!refreshToken || !activeSession || activeSession.refreshToken !== refreshToken) {
      return mockServerDelay<AuthSession>('auth.refresh', undefined as never, {
        shouldFail: true,
      });
    }

    activeSession = {
      ...activeSession,
      accessToken: createMockToken('access'),
      expiresIn: 3600,
      refreshToken: createMockToken('refresh'),
    };

    return mockServerDelay('auth.refresh', activeSession);
  },

  async logout() {
    activeSession = undefined;

    return mockServerDelay('auth.logout', { accepted: true });
  },

  async getMe(): Promise<AuthMe> {
    if (!activeSession) {
      return mockServerDelay<AuthMe>('auth.me', undefined as never, {
        shouldFail: true,
      });
    }

    return mockServerDelay('auth.me', {
      musicPlatform: {
        connected: false,
        selectedPlatformId: 'none',
        updatedAt: new Date().toISOString(),
      },
      profile: activeSession.profile,
      user: activeSession.user,
    });
  },

  async migrateLocalData(
    payload: LocalDataMigrationPayload,
  ): Promise<LocalDataMigrationResult> {
    return mockServerDelay('auth.migrateLocalData', {
      accepted: true,
      migrated: {
        libraryTrackCount: payload.libraryTrackCount,
        momentLogCount: payload.momentLogCount,
        recapDraftCount: payload.recapDraftCount,
      },
    });
  },
};
