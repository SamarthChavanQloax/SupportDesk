import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient, configureApiAuth } from '../api-client';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    configureApiAuth(() => null, () => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('builds requests against VITE_API_BASE_URL and attaches Bearer token', async () => {
    configureApiAuth(() => 'jwt-token-123', () => {});

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { ok: true },
          error: null,
          meta: {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    globalThis.fetch = fetchMock;

    const result = await apiClient.get<{ ok: boolean }>('/tickets');

    expect(result.data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/tickets');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-token-123');
  });

  it('maps API error envelopes to ApiError and triggers unauthorized handler on 401', async () => {
    const onUnauthorized = vi.fn();
    configureApiAuth(() => 'expired-token', onUnauthorized);

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
          meta: {},
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(apiClient.get('/tickets')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('throws a clean NETWORK_ERROR ApiError when fetch rejects', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    let caught: unknown;
    try {
      await apiClient.post('/auth/login', { email: 'a@b.com', password: 'secret' });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).code).toBe('NETWORK_ERROR');
  });
});
