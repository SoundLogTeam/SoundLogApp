import { createIdempotencyKey, isRealApiEnabled, requestApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import {
  AuthMe,
  AuthSession,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  SocialLoginRequest,
} from '@/types/auth';

export const authApi = {
  getMe: () =>
    isRealApiEnabled()
      ? requestApi<AuthMe>('/v1/me')
      : mockServer.auth.getMe(),
  logout: (refreshToken?: string) =>
    isRealApiEnabled()
      ? requestApi<{ accepted: boolean }>('/v1/auth/logout', {
          auth: false,
          body: { refreshToken },
          method: 'POST',
        })
      : mockServer.auth.logout(),
  migrateLocalData: (payload: LocalDataMigrationPayload) =>
    isRealApiEnabled()
      ? requestApi<LocalDataMigrationResult>('/v1/me/migrate-local-data', {
          body: payload,
          idempotencyKey: payload.idempotencyKey ?? createIdempotencyKey('migration'),
          method: 'POST',
        })
      : mockServer.auth.migrateLocalData(payload),
  refresh: (refreshToken?: string) =>
    isRealApiEnabled()
      ? requestApi<AuthSession>('/v1/auth/refresh', {
          auth: false,
          body: { refreshToken },
          method: 'POST',
          retryOnUnauthorized: false,
        })
      : mockServer.auth.refresh(refreshToken),
  socialLogin: (request: SocialLoginRequest) =>
    isRealApiEnabled()
      ? requestApi<AuthSession>('/v1/auth/social-login', {
          auth: false,
          body: request,
          method: 'POST',
          retryOnUnauthorized: false,
        })
      : mockServer.auth.socialLogin(request),
};
