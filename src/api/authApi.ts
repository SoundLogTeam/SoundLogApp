import { createIdempotencyKey, requestApi } from '@/api/client';
import {
  AuthMe,
  AuthSession,
  LoginRequest,
  LocalDataMigrationPayload,
  LocalDataMigrationResult,
  RegisterRequest,
} from '@/types/auth';

export const authApi = {
  deleteAccount: async () => {
    return requestApi<{ deleted: boolean }>('/v1/me', {
      method: 'DELETE',
      retryOnUnauthorized: false,
    });
  },
  getMe: async () => {
    return requestApi<AuthMe>('/v1/me');
  },
  login: async (request: LoginRequest) => {
    return requestApi<AuthSession>('/v1/auth/login', {
      auth: false,
      body: request,
      method: 'POST',
      retryOnUnauthorized: false,
    });
  },
  logout: async (refreshToken?: string) => {
    return requestApi<{ accepted: boolean }>('/v1/auth/logout', {
      auth: false,
      body: { refreshToken },
      method: 'POST',
    });
  },
  migrateLocalData: async (payload: LocalDataMigrationPayload) => {
    return requestApi<LocalDataMigrationResult>('/v1/me/migrate-local-data', {
      body: payload,
      idempotencyKey: payload.idempotencyKey ?? createIdempotencyKey('migration'),
      method: 'POST',
    });
  },
  refresh: async (refreshToken?: string) => {
    return requestApi<AuthSession>('/v1/auth/refresh', {
      auth: false,
      body: { refreshToken },
      method: 'POST',
      retryOnUnauthorized: false,
    });
  },
  register: async (request: RegisterRequest) => {
    return requestApi<AuthSession>('/v1/auth/register', {
      auth: false,
      body: request,
      method: 'POST',
      retryOnUnauthorized: false,
    });
  },
};
