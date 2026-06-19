type Envelope<T> = {
  data: T;
};

type RequestOptions = {
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  query?: Record<string, unknown>;
};

const DEFAULT_API_BASE_URL = 'http://localhost:4000';
const DEV_DEVICE_ID = 'local-soundlog-user';

let accessToken: string | undefined;
let loginPromise: Promise<string> | undefined;

function getApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL ?? DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
}

function appendQuery(url: URL, query?: Record<string, unknown>) {
  if (!query) {
    return;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(','));
      return;
    }

    url.searchParams.set(key, String(value));
  });
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? `Soundlog API request failed: ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

async function ensureAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  if (!loginPromise) {
    loginPromise = requestEnvelope<{
      accessToken: string;
      expiresIn: number;
      refreshToken: string;
    }>('/v1/auth/social-login', {
      auth: false,
      method: 'POST',
      body: {
        provider: 'google',
        providerToken: 'local-dev-token',
        deviceId: DEV_DEVICE_ID,
      },
    }).then((tokens) => {
      accessToken = tokens.accessToken;
      return tokens.accessToken;
    });
  }

  return loginPromise;
}

export async function requestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${getApiBaseUrl()}${path}`);
  appendQuery(url, options.query);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth ?? true) {
    headers.Authorization = `Bearer ${await ensureAccessToken()}`;
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const envelope = await parseJsonResponse<Envelope<T>>(response);

  return envelope.data;
}

