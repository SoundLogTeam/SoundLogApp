import { createIdempotencyKey, requestApi, shouldUseServerApi } from '@/api/client';
import { mockServer } from '@/mock-server';
import {
  AuthMe,
  AuthSession,
  LoginRequest,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  RegisterRequest,
} from '@/types/auth';

export const authApi = {
  getMe: () =>
    shouldUseServerApi()
      ? requestApi<AuthMe>('/v1/me')
      : mockServer.auth.getMe(),
  login: (request: LoginRequest) =>
    shouldUseServerApi()
      ? requestApi<AuthSession>('/v1/auth/login', {
          auth: false,
          body: request,
          method: 'POST',
          retryOnUnauthorized: false,
        })
      : mockServer.auth.login(request),
  logout: (refreshToken?: string) =>
    shouldUseServerApi()
      ? requestApi<{ accepted: boolean }>('/v1/auth/logout', {
          auth: false,
          body: { refreshToken },
          method: 'POST',
        })
      : mockServer.auth.logout(),
  migrateLocalData: (payload: LocalDataMigrationPayload) =>
    shouldUseServerApi()
      ? requestApi<LocalDataMigrationResult>('/v1/me/migrate-local-data', {
          body: payload,
          idempotencyKey: payload.idempotencyKey ?? createIdempotencyKey('migration'),
          method: 'POST',
        })
      : mockServer.auth.migrateLocalData(payload),
  refresh: (refreshToken?: string) =>
    shouldUseServerApi()
      ? requestApi<AuthSession>('/v1/auth/refresh', {
          auth: false,
          body: { refreshToken },
          method: 'POST',
          retryOnUnauthorized: false,
        })
      : mockServer.auth.refresh(refreshToken),
  register: (request: RegisterRequest) =>
    shouldUseServerApi()
      ? requestApi<AuthSession>('/v1/auth/register', {
          auth: false,
          body: request,
          method: 'POST',
          retryOnUnauthorized: false,
        })
      : mockServer.auth.register(request),
};
