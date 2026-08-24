import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPageMeta, requestApi } from '@/api/client';
import { libraryApi } from '@/api/libraryApi';
import { momentLogApi, RECAP_CAPTURE_PAGE_LIMIT } from '@/api/momentLogApi';
import { useAuthStore } from '@/store/authStore';

// P2-2: the server's pagedResponse() shape is `{ data, page: { limit,
// nextCursor } }`. unwrapData used to discard `page` outright, so cursor
// pagination was unreachable from the client and any list beyond the
// server's default limit was permanently inaccessible. These tests pin the
// fix: page metadata now rides along on the returned data (readable via
// getPageMeta) without changing what existing callers receive.

function seedAuthenticated() {
  useAuthStore.setState({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    status: 'authenticated',
    user: { displayName: 'Test', id: 'user-a', provider: 'email' },
  } as never);
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL = 'https://api.test.local';
  useAuthStore.setState({
    accessToken: undefined,
    refreshToken: undefined,
    status: 'unauthenticated',
    user: undefined,
  } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getPageMeta / unwrapData (P2-2)', () => {
  it('exposes page metadata for a paged list response without changing the returned data', async () => {
    seedAuthenticated();

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [{ id: 'a' }, { id: 'b' }],
          page: { limit: 2, nextCursor: 'cursor-2' },
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await requestApi<Array<{ id: string }>>('/v1/some-list');

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(getPageMeta(result)).toEqual({ limit: 2, nextCursor: 'cursor-2' });
  });

  it('returns undefined page metadata for a non-paged response (existing callers unaffected)', async () => {
    seedAuthenticated();

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: { id: 'solo' } }), { status: 200 }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await requestApi<{ id: string }>('/v1/some-resource');

    expect(result).toEqual({ id: 'solo' });
    expect(getPageMeta(result)).toBeUndefined();
  });
});

describe('libraryApi.getTracks pagination (P2-2)', () => {
  it('forwards the cursor to the server and surfaces nextCursor for the following page', async () => {
    seedAuthenticated();

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = new URL(String(input));
      const cursor = url.searchParams.get('cursor');

      if (!cursor) {
        return new Response(
          JSON.stringify({
            data: [{ createdAt: 't', id: 'track-1', kind: 'liked', track: { id: 'track-1' } }],
            page: { limit: 1, nextCursor: 'page-2' },
          }),
          { status: 200 },
        );
      }

      expect(cursor).toBe('page-2');

      return new Response(
        JSON.stringify({
          data: [{ createdAt: 't', id: 'track-2', kind: 'liked', track: { id: 'track-2' } }],
          page: { limit: 1, nextCursor: null },
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const firstPage = await libraryApi.getTracks('liked');
    expect(firstPage.records.map((record) => record.id)).toEqual(['track-1']);
    expect(firstPage.page?.nextCursor).toBe('page-2');

    const secondPage = await libraryApi.getTracks('liked', firstPage.page?.nextCursor ?? undefined);
    expect(secondPage.records.map((record) => record.id)).toEqual(['track-2']);
    expect(secondPage.page?.nextCursor).toBeNull();
  });

  it('returns an empty page without calling the server when not authenticated', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await libraryApi.getTracks('liked');

    expect(result).toEqual({ records: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('momentLogApi.getAllMomentLogs', () => {
  it('uses the server page limit and follows every cursor for one travel session', async () => {
    seedAuthenticated();

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = new URL(String(input));
      const cursor = url.searchParams.get('cursor');

      expect(url.searchParams.get('limit')).toBe(String(RECAP_CAPTURE_PAGE_LIMIT));
      expect(url.searchParams.get('sessionId')).toBe('session-a');

      if (!cursor) {
        return new Response(
          JSON.stringify({
            data: [{ createdAt: '2026-08-24T00:00:00.000Z', id: 'moment-1', moodTags: [] }],
            page: { limit: RECAP_CAPTURE_PAGE_LIMIT, nextCursor: 'page-2' },
          }),
          { status: 200 },
        );
      }

      expect(cursor).toBe('page-2');

      return new Response(
        JSON.stringify({
          data: [{ createdAt: '2026-08-24T00:01:00.000Z', id: 'moment-2', moodTags: [] }],
          page: { limit: RECAP_CAPTURE_PAGE_LIMIT, nextCursor: null },
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await momentLogApi.getAllMomentLogs({ sessionId: 'session-a' });

    expect(result.map((moment) => moment.id)).toEqual(['moment-1', 'moment-2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
