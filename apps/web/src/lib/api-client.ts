export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  error: null;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorEnvelope {
  data: null;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | Record<string, unknown>;
  };
  meta: ApiMeta;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[] | Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[] | Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getAccessToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function configureApiAuth(
  tokenGetter: TokenGetter,
  unauthorizedHandler: UnauthorizedHandler
): void {
  getAccessToken = tokenGetter;
  onUnauthorized = unauthorizedHandler;
}

function resolveBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
    throw new ApiError(
      0,
      'CONFIGURATION_ERROR',
      'API base URL is not configured (VITE_API_BASE_URL).'
    );
  }
  return baseUrl.replace(/\/+$/, '');
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean }
): Promise<ApiSuccessEnvelope<T>> {
  const baseUrl = resolveBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options?.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${normalizedPath}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the SupportDesk server. Please check your connection and try again.'
    );
  }

  let parsed: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    parsed = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    if (response.status === 401 && !options?.skipAuth && onUnauthorized) {
      onUnauthorized();
    }

    const errPayload = parsed && 'error' in parsed && parsed.error ? parsed.error : null;
    throw new ApiError(
      response.status,
      errPayload?.code || `HTTP_${response.status}`,
      errPayload?.message || `Request failed with status ${response.status}`,
      errPayload?.details
    );
  }

  if (!parsed || parsed.error !== null) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Unexpected response format from SupportDesk API.'
    );
  }

  return parsed as ApiSuccessEnvelope<T>;
}

async function stream(
  path: string,
  callbacks: {
    onChunk: (chunk: string) => void;
    onDone?: (meta?: any) => void;
    onError?: (error: Error) => void;
  },
  options?: { signal?: AbortSignal }
): Promise<void> {
  const baseUrl = resolveBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${normalizedPath}`, {
      method: 'GET',
      headers,
      signal: options?.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    const netErr = new ApiError(0, 'NETWORK_ERROR', 'Stream connection failed');
    callbacks.onError?.(netErr);
    throw netErr;
  }

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const err = new ApiError(
      response.status,
      `HTTP_${response.status}`,
      `Streaming failed with status ${response.status}`
    );
    callbacks.onError?.(err);
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const noBodyErr = new ApiError(0, 'STREAM_ERROR', 'No response body to stream');
    callbacks.onError?.(noBodyErr);
    throw noBodyErr;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.chunk) {
              callbacks.onChunk(data.chunk);
            }
            if (data.done) {
              callbacks.onDone?.(data.meta);
            }
            if (data.error) {
              callbacks.onError?.(new Error(data.error));
            }
          } catch {
            // ignore malformed event lines
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    callbacks.onError?.(err);
    throw err;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: { skipAuth?: boolean }) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: { skipAuth?: boolean }) =>
    request<T>('DELETE', path, undefined, options),
  stream,
};

