import { afterEach, describe, expect, it, vi } from 'vitest';

import { toAuthenticatedImageSource } from '@/utils/authenticatedImageSource';

const TOKEN = 'test-access-token';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('toAuthenticatedImageSource', () => {
  it('returns undefined for undefined input', () => {
    expect(toAuthenticatedImageSource(undefined, TOKEN)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(toAuthenticatedImageSource('', TOKEN)).toBeUndefined();
  });

  describe('relative uploads paths (implicitly same-origin, no allowlist needed)', () => {
    it('attaches the Authorization header for a relative /uploads/<id> path', () => {
      const result = toAuthenticatedImageSource('/uploads/a.jpg', TOKEN);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${TOKEN}` },
        uri: '/uploads/a.jpg',
      });
    });

    it('attaches the Authorization header for a relative /v1/uploads/<id> path', () => {
      const result = toAuthenticatedImageSource('/v1/uploads/a.jpg', TOKEN);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${TOKEN}` },
        uri: '/v1/uploads/a.jpg',
      });
    });

    it('attaches the header for a relative path with a query string', () => {
      const uri = '/v1/uploads/abc123?x=1';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result?.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
      expect(result?.uri).toBe(uri);
    });
  });

  describe('absolute uploads URLs — only on an allowlisted origin', () => {
    it('attaches the header when the origin matches EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://api.soundlog.shop');

      const uri = 'https://api.soundlog.shop/v1/uploads/abc123';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${TOKEN}` },
        uri,
      });
    });

    it('attaches the header when the origin matches EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN, even though it differs from the API base URL', () => {
      // Mirrors production: JSON API calls go through a Vercel proxy on soundlog.shop,
      // while uploaded photos are served directly from api.soundlog.shop.
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://soundlog.shop/api/soundlog');
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN', 'https://api.soundlog.shop');

      const uri = 'https://api.soundlog.shop/v1/uploads/abc123';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${TOKEN}` },
        uri,
      });
    });

    it('preserves the query string on an allowlisted absolute origin', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://api.soundlog.shop');

      const uri = 'https://api.soundlog.shop/v1/uploads/abc123?cachebust=1&x=2';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${TOKEN}` },
        uri,
      });
    });

    it('does NOT attach the header to the upload host when EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN is unset and it differs from the API base origin (safe fallback)', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://soundlog.shop/api/soundlog');
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN', '');

      const uri = 'https://api.soundlog.shop/v1/uploads/abc123';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('attaches the header for local/native/web-style base URLs when they are the configured API base', () => {
      const hosts = [
        'https://api.soundlog.shop',
        'https://soundlog.shop',
        'http://127.0.0.1:4000',
        'http://localhost:4000',
      ];

      for (const host of hosts) {
        vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', host);

        const uri = `${host}/v1/uploads/abc123`;
        const result = toAuthenticatedImageSource(uri, TOKEN);

        expect(result).toEqual({
          headers: { Authorization: `Bearer ${TOKEN}` },
          uri,
        });
      }
    });
  });

  describe('token leak vulnerability: absolute URL on an untrusted origin', () => {
    it('does NOT attach the header to an arbitrary external host, even with the exact uploads pathname shape', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://soundlog.shop/api/soundlog');
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN', 'https://api.soundlog.shop');

      const uri = 'https://evil.example.com/uploads/anything';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('does NOT attach the header to an untrusted host even when no allowlist env vars are configured at all', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', '');
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN', '');

      const uri = 'https://host/uploads/a.jpg';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('does not leak the token even to a host that spells out the internal placeholder base used for relative-URL parsing', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://soundlog.shop/api/soundlog');

      const uri = 'http://soundlog-local.invalid/uploads/a.jpg';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('does not leak the token to a protocol-relative decoy host', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://soundlog.shop/api/soundlog');

      const uri = '//evil.example.com/uploads/a.jpg';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });
  });

  describe('no double conversion', () => {
    it('does not alter or double-prefix a URL that is already in /v1/uploads/ form', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://api.soundlog.shop');

      const uri = 'https://api.soundlog.shop/v1/uploads/abc123';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      // The returned uri must be byte-for-byte identical to the input — no re-prefixing,
      // no "/v1/v1/uploads/..." mangling, no re-encoding.
      expect(result?.uri).toBe(uri);
      expect(result?.uri).not.toContain('/v1/v1/uploads/');
      expect(result?.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
    });

    it('is idempotent: passing the already-converted uri through again yields the same result', () => {
      const uri = '/v1/uploads/abc123';
      const first = toAuthenticatedImageSource(uri, TOKEN);
      const second = toAuthenticatedImageSource(first?.uri, TOKEN);

      expect(second).toEqual(first);
    });
  });

  describe('unrelated paths / external URLs that must never receive the token', () => {
    it('does not attach a header when "/uploads/" appears mid-path, even on an allowlisted origin', () => {
      vi.stubEnv('EXPO_PUBLIC_SOUNDLOG_API_BASE_URL', 'https://api.soundlog.shop');

      const uri = 'https://cdn.example.com/gallery/uploads/photo.jpg';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('does not attach a header for an unrelated external URL containing "uploads" as a word fragment', () => {
      const uri = 'https://example.com/my-uploads-page';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('leaves external album art URLs completely unchanged', () => {
      const uri = 'https://i.scdn.co/image/ab67616d0000b273abc123';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
    });

    it('leaves external tourism API photo URLs completely unchanged', () => {
      const uri = 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
    });

    it('leaves local file:// capture previews unchanged', () => {
      const uri = 'file:///var/mobile/Containers/Data/tmp/capture.jpg';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result).toEqual({ uri });
    });
  });

  describe('URL-encoded paths', () => {
    it('still recognizes a relative uploads path whose fileId segment is percent-encoded', () => {
      const uri = '/v1/uploads/%EA%B0%80%EB%82%98%EB%8B%A4';
      const result = toAuthenticatedImageSource(uri, TOKEN);

      expect(result?.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
      expect(result?.uri).toBe(uri);
    });
  });

  describe('malformed input', () => {
    it('does not throw for a malformed/garbage uri and treats it as external (no header)', () => {
      const uri = 'not a url \\ with spaces and no scheme';

      expect(() => toAuthenticatedImageSource(uri, TOKEN)).not.toThrow();

      const result = toAuthenticatedImageSource(uri, TOKEN);
      expect(result).not.toHaveProperty('headers');
    });
  });

  describe('token presence', () => {
    it('does not attach a header when accessToken is undefined, even for a matching relative uploads URL', () => {
      const uri = '/v1/uploads/abc123';
      const result = toAuthenticatedImageSource(uri, undefined);

      expect(result).toEqual({ uri });
      expect(result).not.toHaveProperty('headers');
    });

    it('does not attach a header when accessToken is an empty string', () => {
      const uri = '/v1/uploads/abc123';
      const result = toAuthenticatedImageSource(uri, '');

      expect(result).toEqual({ uri });
    });

    it('reflects whatever token value is passed in at call time (no caching/staleness)', () => {
      const uri = '/v1/uploads/abc123';

      const withOldToken = toAuthenticatedImageSource(uri, 'old-token');
      const withNewToken = toAuthenticatedImageSource(uri, 'new-token');

      expect(withOldToken?.headers?.Authorization).toBe('Bearer old-token');
      expect(withNewToken?.headers?.Authorization).toBe('Bearer new-token');
    });
  });
});
