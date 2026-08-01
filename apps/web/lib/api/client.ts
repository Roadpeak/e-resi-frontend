/**
 * Thin fetch wrapper — base URL: http://localhost:4000/api
 * Automatically injects Bearer token from auth store.
 * On 401, attempts a silent refresh then retries once.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Skip auth header even if token is present */
  skipAuth?: boolean;
};

// Lazy import to avoid circular dependency (auth store imports apiClient)
let getAccessToken: (() => string | null) | null = null;
let doRefresh: (() => Promise<boolean>) | null = null;

export function setAuthHandlers(
  tokenGetter: () => string | null,
  refreshHandler: () => Promise<boolean>,
) {
  getAccessToken = tokenGetter;
  doRefresh = refreshHandler;
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { body, skipAuth, headers: extraHeaders, ...rest } = opts;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth && getAccessToken) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include', // send cookies (refresh token)
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // Never attempt a refresh for the refresh/logout calls themselves: a 401 from
  // /auth/refresh would re-enter doRefresh() and recurse indefinitely.
  const isAuthEndpoint = path.startsWith('/auth/refresh') || path.startsWith('/auth/logout');

  if (res.status === 401 && !isRetry && !isAuthEndpoint && doRefresh) {
    const refreshed = await doRefresh();
    if (refreshed) {
      return request<T>(method, path, opts, true);
    }
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    const msg =
      (data as { error?: string; message?: string })?.error ??
      (data as { error?: string; message?: string })?.message ??
      res.statusText;
    throw new ApiError(res.status, data, msg);
  }

  // Backend wraps responses: { success, data } — unwrap transparently
  if (data && typeof data === 'object' && 'success' in (data as object) && 'data' in (data as object)) {
    return (data as { data: T }).data;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
