import { useAuthStore } from '@/store/authStore';
import { AuthSession } from '@/types/auth';
import { clearAccountSession } from '@/utils/accountSession';

type QueryValue = boolean | number | string | Array<boolean | number | string> | null | undefined;

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean;
  body?: BodyInit | Record<string, unknown> | unknown[];
  idempotencyKey?: string;
  query?: Record<string, QueryValue>;
  retryOnUnauthorized?: boolean;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiFileUploadOptions = {
  fieldName?: string;
  httpMethod?: 'POST' | 'PUT';
  idempotencyKey?: string;
  mimeType: string;
  parameters?: Record<string, string>;
};

let refreshSessionPromise: Promise<string | undefined> | undefined;
const JSON_REQUEST_TIMEOUT_MS = 15_000;
const MULTIPART_REQUEST_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL?.replace(/\/+$/, '');
}

export function isRealApiEnabled() {
  return Boolean(getApiBaseUrl());
}

export function shouldUseServerApi() {
  return true;
}

export function shouldAttemptAuthenticatedApi() {
  const { status } = useAuthStore.getState();

  return (
    status === 'authenticated'
  );
}

export function createIdempotencyKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createQueryString(params: Record<string, QueryValue> = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, value.map(String).join(','));
      }
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function toRequestBody(body: ApiRequestOptions['body']) {
  if (!body || isFormDataBody(body) || typeof body === 'string') {
    return body as BodyInit | undefined;
  }

  return JSON.stringify(body);
}

function shouldSendJsonContentType(body: ApiRequestOptions['body']) {
  return Boolean(body && !isFormDataBody(body) && typeof body !== 'string');
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as unknown;
}

async function refreshSession(baseUrl: string) {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    return undefined;
  }

  const response = await fetch(`${baseUrl}/v1/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    clearAccountSession();
    return undefined;
  }

  const session = unwrapData<AuthSession>(await parseJsonResponse(response));
  useAuthStore.getState().finishLogin(session);

  return session.accessToken;
}

function refreshSessionOnce(baseUrl: string) {
  refreshSessionPromise ??= refreshSession(baseUrl).finally(() => {
    refreshSessionPromise = undefined;
  });

  return refreshSessionPromise;
}

async function sendRequest<T>(
  path: string,
  options: ApiRequestOptions,
  accessToken?: string,
) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ApiError('서버 API URL이 설정되지 않았습니다.', 0, 'API_BASE_URL_MISSING');
  }

  const {
    auth: _auth,
    body,
    idempotencyKey,
    query,
    retryOnUnauthorized: _retryOnUnauthorized,
    ...requestOptions
  } = options;
  const headers = new Headers(requestOptions.headers);
  const abortController = requestOptions.signal ? undefined : new AbortController();
  const requestTimeout = setTimeout(
    () => abortController?.abort(),
    isFormDataBody(body) ? MULTIPART_REQUEST_TIMEOUT_MS : JSON_REQUEST_TIMEOUT_MS,
  );

  if (options.auth !== false && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }

  if (shouldSendJsonContentType(body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}${createQueryString(query)}`, {
      ...requestOptions,
      body: toRequestBody(body),
      headers,
      signal: requestOptions.signal ?? abortController?.signal,
    });
  } catch (error) {
    if (abortController?.signal.aborted) {
      throw new ApiError('서버 응답이 늦어 요청을 중단했어요. 다시 시도해주세요.', 408, 'TIMEOUT');
    }

    throw error;
  } finally {
    clearTimeout(requestTimeout);
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | undefined;
    const message = errorPayload?.error?.message ?? `API 요청에 실패했습니다. (${response.status})`;

    throw new ApiError(message, response.status, errorPayload?.error?.code);
  }

  return unwrapData<T>(payload);
}

export async function requestApi<T>(path: string, options: ApiRequestOptions = {}) {
  const accessToken = useAuthStore.getState().accessToken;

  try {
    return await sendRequest<T>(path, options, accessToken);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      options.auth !== false &&
      options.retryOnUnauthorized !== false
    ) {
      const nextAccessToken = await refreshSessionOnce(getApiBaseUrl() ?? '');

      if (nextAccessToken) {
        return sendRequest<T>(path, { ...options, retryOnUnauthorized: false }, nextAccessToken);
      }
    }

    throw error;
  }
}

async function sendFileUpload<T>(
  path: string,
  fileUri: string,
  options: ApiFileUploadOptions,
  accessToken?: string,
) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ApiError('서버 API URL이 설정되지 않았습니다.', 0, 'API_BASE_URL_MISSING');
  }

  const { File, UploadType } = await import('expo-file-system');
  const headers: Record<string, string> = {};
  const abortController = new AbortController();
  const requestTimeout = setTimeout(
    () => abortController.abort(),
    MULTIPART_REQUEST_TIMEOUT_MS,
  );

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  try {
    const result = await new File(fileUri).upload(`${baseUrl}${path}`, {
      fieldName: options.fieldName ?? 'photo',
      headers,
      httpMethod: options.httpMethod ?? 'POST',
      mimeType: options.mimeType,
      parameters: options.parameters,
      sessionType: 'foreground',
      signal: abortController.signal,
      uploadType: UploadType.MULTIPART,
    });
    const payload = result.body ? (JSON.parse(result.body) as unknown) : undefined;

    if (result.status < 200 || result.status >= 300) {
      const errorPayload = payload as ApiErrorResponse | undefined;
      const message =
        errorPayload?.error?.message ?? `API 요청에 실패했습니다. (${result.status})`;

      throw new ApiError(message, result.status, errorPayload?.error?.code);
    }

    return unwrapData<T>(payload);
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new ApiError('서버 응답이 늦어 요청을 중단했어요. 다시 시도해주세요.', 408, 'TIMEOUT');
    }

    throw error;
  } finally {
    clearTimeout(requestTimeout);
  }
}

export async function uploadApiFile<T>(
  path: string,
  fileUri: string,
  options: ApiFileUploadOptions,
) {
  const accessToken = useAuthStore.getState().accessToken;

  try {
    return await sendFileUpload<T>(path, fileUri, options, accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const nextAccessToken = await refreshSessionOnce(getApiBaseUrl() ?? '');

      if (nextAccessToken) {
        return sendFileUpload<T>(path, fileUri, options, nextAccessToken);
      }
    }

    throw error;
  }
}
