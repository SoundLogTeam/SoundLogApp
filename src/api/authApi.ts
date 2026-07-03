import { createIdempotencyKey, requestApi, shouldUseServerApi } from '@/api/client';
import { getMockServer } from '@/api/mockServerClient';
import {
  AuthMe,
  AuthSession,
  LoginRequest,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  RegisterRequest,
} from '@/types/auth';

export const authApi = {
  getMe: async () => {
    if (shouldUseServerApi()) {
      return requestApi<AuthMe>('/v1/me');
    }

    const mockServer = await getMockServer();
    return mockServer.auth.getMe();
  },
  login: async (request: LoginRequest) => {
    if (shouldUseServerApi()) {
      return requestApi<AuthSession>('/v1/auth/login', {
        auth: false,
        body: request,
        method: 'POST',
        retryOnUnauthorized: false,
      });
    }

    const mockServer = await getMockServer();
    return mockServer.auth.login(request);
  },
  logout: async (refreshToken?: string) => {
    if (shouldUseServerApi()) {
      return requestApi<{ accepted: boolean }>('/v1/auth/logout', {
        auth: false,
        body: { refreshToken },
        method: 'POST',
      });
    }

    const mockServer = await getMockServer();
    return mockServer.auth.logout();
  },
  migrateLocalData: async (payload: LocalDataMigrationPayload) => {
    if (shouldUseServerApi()) {
      return requestApi<LocalDataMigrationResult>('/v1/me/migrate-local-data', {
        body: payload,
        idempotencyKey: payload.idempotencyKey ?? createIdempotencyKey('migration'),
        method: 'POST',
      });
    }

    const mockServer = await getMockServer();
    return mockServer.auth.migrateLocalData(payload);
  },
  refresh: async (refreshToken?: string) => {
    if (shouldUseServerApi()) {
      return requestApi<AuthSession>('/v1/auth/refresh', {
        auth: false,
        body: { refreshToken },
        method: 'POST',
        retryOnUnauthorized: false,
      });
    }

    const mockServer = await getMockServer();
    return mockServer.auth.refresh(refreshToken);
  },
  register: async (request: RegisterRequest) => {
    if (shouldUseServerApi()) {
      return requestApi<AuthSession>('/v1/auth/register', {
        auth: false,
        body: request,
        method: 'POST',
        retryOnUnauthorized: false,
      });
    }

    const mockServer = await getMockServer();
    return mockServer.auth.register(request);
  },
};
