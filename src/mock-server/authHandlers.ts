import { mockServerDelay } from '@/mock-server/delay';
import {
  AuthMe,
  AuthSession,
  LoginRequest,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  RegisterRequest,
} from '@/types/auth';

let refreshTokenSeed = 1;
let activeSession: AuthSession | undefined;
const passwordUsers = new Map<string, { displayName: string; password: string }>();

function createMockToken(prefix: string) {
  refreshTokenSeed += 1;
  return `mock-${prefix}-${Date.now()}-${refreshTokenSeed}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getDefaultDisplayName(email: string) {
  return email.split('@')[0] || 'Soundlog User';
}

function createSession(email: string, displayName?: string, isNewUser = false): AuthSession {
  const normalizedEmail = normalizeEmail(email);

  return {
    accessToken: createMockToken('access'),
    expiresIn: 3600,
    isNewUser,
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
      displayName: displayName?.trim() || getDefaultDisplayName(normalizedEmail),
      email: normalizedEmail,
      id: `mock-user-email-${normalizedEmail}`,
      provider: 'email',
    },
  };
}

export const authMockHandlers = {
  async login(request: LoginRequest) {
    const email = normalizeEmail(request.email);
    const user = passwordUsers.get(email);

    if (!user || user.password !== request.password) {
      return mockServerDelay<AuthSession>('auth.login', undefined as never, {
        shouldFail: true,
      });
    }

    const session = createSession(email, user.displayName);
    activeSession = session;

    return mockServerDelay('auth.login', session);
  },

  async register(request: RegisterRequest) {
    const email = normalizeEmail(request.email);

    if (passwordUsers.has(email)) {
      return mockServerDelay<AuthSession>('auth.register', undefined as never, {
        shouldFail: true,
      });
    }

    const displayName = request.displayName?.trim() || getDefaultDisplayName(email);
    passwordUsers.set(email, {
      displayName,
      password: request.password,
    });

    const session = createSession(email, displayName, true);
    activeSession = session;

    return mockServerDelay('auth.register', session);
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
